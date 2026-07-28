const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const commerce = require('./pilot-commerce');

const ROOT = __dirname;
const DIST_ROOT = path.join(__dirname, 'dist');
const DASHBOARD2_ROOT = path.join(require('os').homedir(), 'Downloads', 'DTC-dashboard-2');
const NOTION_VERSION = '2025-09-03';

// Legacy Notion helpers remain for compatibility, but proposal routes no longer call them.
let CACHED_DATA_SOURCE_ID = null;

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw || raw.length > 1_000_000) throw new Error('Invalid request body');
  return JSON.parse(raw);
}

async function readRawBody(req, { maxBytes = 1_000_000 } = {}) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Request body too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const validEmail = value => /^\S+@\S+\.\S+$/.test(String(value || ''));
const escapeHtml = value => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

function normalizeBaseUrl(value) {
  const parsed = new URL(String(value || ''));
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid proposal URL.');
  return parsed.origin;
}

async function loadDotEnv() {
  // Prefer local .env; also accept sibling fc_lead_data/.env so admin + sample share Supabase keys locally.
  const envPaths = [
    path.join(ROOT, '.env'),
    path.join(ROOT, '..', 'fc_lead_data', '.env'),
    path.join(ROOT, '..', '.env'),
  ];

  for (const envPath of envPaths) {
    try {
      const raw = await fs.readFile(envPath, 'utf8');
      raw.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const separator = trimmed.indexOf('=');
        if (separator === -1) return;
        const key = trimmed.slice(0, separator).trim();
        const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && process.env[key] === undefined) {
          process.env[key] = value;
        }
      });
    } catch (error) {
      // .env is optional; production hosts usually inject environment variables directly.
    }
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const FIELD_NAMES = [
  'template_type',
  'brand_primary_color',
  'brand_second_color',
  'brand_dark_color',
  'brand_light_color',
  'brand_name',
  'id',
  'brand_channel_name',
  'hero_image_url',
  'device_rendering_image_url',
  'hook1_example_1',
  'hook1_example_2',
  'hook1_example_3',
  'content_pillar_1_title',
  'content_pillar_1_body',
  'content_pillar_2_title',
  'content_pillar_2_body',
  'content_pillar_3_title',
  'content_pillar_3_body',
  'content_pillar_4_title',
  'content_pillar_4_body',
  'content_pillar_5_title',
  'content_pillar_5_body',
  'content_pillar_6_title',
  'content_pillar_6_body',
  'magnet_tap',
  'footer_button_url',
  'campaign_name',
  'hero_title',
  'hero_subtitle',
  'hero_body',
  'hero_image_url',
  'physical_image_url',
  'tap_image_url',
  'journey_image_1_url',
  'journey_image_2_url',
  'journey_image_3_url',
  'journey_image_4_url',
  'journey_image_5_url',
  'customer_demo_url',
  'dashboard_url',
  'dashboard_revenue_image_url',
  'dashboard_funnel_image_url',
  'config_coupon_image_url',
  'config_segment_image_url',
  'config_survey_image_url',
  'contact_name',
  'contact_email'
];

function slugify(value) {
  return String(value || 'nike').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'nike';
}

function normalizeNotionUuidForMatch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '');
}

function isNotionUuidLike(value) {
  const n = normalizeNotionUuidForMatch(value);
  return n.length === 32 && /^[0-9a-f]{32}$/.test(n);
}

/** Notion REST paths expect hyphenated UUIDs */
function formatNotionIdForApi(raw) {
  const stripped = normalizeNotionUuidForMatch(raw);
  if (stripped.length === 32 && /^[0-9a-f]{32}$/.test(stripped)) {
    return `${stripped.slice(0, 8)}-${stripped.slice(8, 12)}-${stripped.slice(12, 16)}-${stripped.slice(16, 20)}-${stripped.slice(20, 32)}`;
  }
  return String(raw || '').trim();
}

/**
 * In Notion API 2025-09-03 a page's parent can be either `database_id`
 * (legacy) or `data_source_id` (multi-source DBs). We accept either and
 * compare against both the configured DB and the configured data source.
 */
function notionPageBelongsToConfigured(page, expected) {
  const parent = page && page.parent;
  if (!parent) return false;

  const expectedDb = normalizeNotionUuidForMatch(expected.databaseId);
  const expectedDs = normalizeNotionUuidForMatch(expected.dataSourceId);

  if (parent.type === 'data_source_id' && parent.data_source_id) {
    if (expectedDs && normalizeNotionUuidForMatch(parent.data_source_id) === expectedDs) {
      return true;
    }
  }
  if (parent.type === 'database_id' && parent.database_id) {
    if (expectedDb && normalizeNotionUuidForMatch(parent.database_id) === expectedDb) {
      return true;
    }
  }
  return false;
}

async function notionFetch(url, options, label) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch (_) {}
    console.error(
      `[notion] ${label} failed: ${response.status} ${response.statusText} -> ${bodyText.slice(0, 500)}`
    );
  }
  return response;
}

async function retrieveNotionPage(pageId, token) {
  const formatted = formatNotionIdForApi(pageId);
  const response = await notionFetch(
    `https://api.notion.com/v1/pages/${formatted}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION
      }
    },
    `GET /v1/pages/${formatted}`
  );
  if (!response.ok) {
    return null;
  }
  return response.json();
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

function getTextValue(property) {
  if (!property) return '';

  if (property.type === 'title') {
    return property.title.map(part => part.plain_text).join('');
  }

  if (property.type === 'rich_text') {
    return property.rich_text.map(part => part.plain_text).join('');
  }

  if (property.type === 'url') {
    return property.url || '';
  }

  if (property.type === 'select') {
    return property.select ? property.select.name : '';
  }

  if (property.type === 'number') {
    return property.number == null ? '' : String(property.number);
  }

  if (property.type === 'unique_id') {
    const u = property.unique_id;
    if (!u) return '';
    const prefix = u.prefix != null && String(u.prefix) !== '' ? String(u.prefix) : '';
    const num = u.number != null ? String(u.number) : '';
    if (prefix && num) return `${prefix}-${num}`;
    return num || prefix;
  }

  if (property.type === 'formula') {
    const f = property.formula;
    const v = f && (f.string ?? f.number ?? f.boolean);
    return v == null ? '' : String(v);
  }

  return '';
}

function normalizeNotionPage(page) {
  const byNormalizedName = Object.entries(page.properties || {}).reduce((acc, [name, property]) => {
    acc[normalizeKey(name)] = property;
    return acc;
  }, {});

  const data = FIELD_NAMES.reduce((acc, fieldName) => {
    acc[fieldName] = getTextValue(byNormalizedName[fieldName]);
    return acc;
  }, {});

  // Notion column names like "Magnet Tap" / "MagnetTap" normalize to magnet_tap
  if (!String(data.magnet_tap || '').trim()) {
    const magnetAliases = ['magnettap', 'magnet_tap_url', 'magnettap_url'];
    for (const key of magnetAliases) {
      const v = getTextValue(byNormalizedName[key]);
      if (String(v || '').trim()) {
        data.magnet_tap = v;
        break;
      }
    }
  }

  if (!String(data.id || '').trim()) {
    const idAliases = ['proposal_id', 'proposalid', 'record_id'];
    for (const key of idAliases) {
      const v = getTextValue(byNormalizedName[key]);
      if (String(v || '').trim()) {
        data.id = v;
        break;
      }
    }
  }

  return data;
}

function cleanColor(value) {
  const color = String(value || '').trim();
  const hexMatch = color.match(/#[0-9a-fA-F]{3,8}/);
  return hexMatch ? hexMatch[0] : color;
}

function cleanProposal(data) {
  const proposal = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  );

  proposal.brand_primary_color = cleanColor(proposal.brand_primary_color);
  proposal.brand_second_color = cleanColor(proposal.brand_second_color);

  if (!proposal.brand_channel_name && proposal.brand_name) {
    proposal.brand_channel_name = `${proposal.brand_name} Family Channel`;
  }

  return proposal;
}

async function loadFallbackProposal(brand) {
  const filePath = path.join(ROOT, 'data', 'proposals', `${slugify(brand)}.json`);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function loadFallbackProposalById(proposalId) {
  const target = String(proposalId || '').trim();
  if (!target) {
    throw new Error('Missing proposal id');
  }
  const dir = path.join(ROOT, 'data', 'proposals');
  const files = await fs.readdir(dir);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(dir, file), 'utf8');
    const data = JSON.parse(raw);
    const aliases = Array.isArray(data.route_aliases) ? data.route_aliases : [];
    if (String(data.id || '').trim() === target || aliases.some(alias => String(alias).trim() === target)) {
      return data;
    }
  }
  throw new Error('Proposal not found');
}

async function queryNotionProposalRows() {
  const token = process.env.NOTION_TOKEN;
  if (!token) return null;

  const dataSourceId = await resolveNotionDataSourceId(token);
  if (!dataSourceId) return null;

  return queryNotionDataSourceAllRows(token, dataSourceId);
}

async function queryNotionDataSourceAllRows(token, dataSourceId) {
  const dsPathId = formatNotionIdForApi(dataSourceId);
  const results = [];
  let start_cursor;

  do {
    const body = { page_size: 100 };
    if (start_cursor) {
      body.start_cursor = start_cursor;
    }

    const response = await notionFetch(
      `https://api.notion.com/v1/data_sources/${dsPathId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': NOTION_VERSION
        },
        body: JSON.stringify(body)
      },
      `POST /v1/data_sources/${dsPathId}/query`
    );

    if (!response.ok) {
      throw new Error(`Notion data source query failed: ${response.status}`);
    }

    const payload = await response.json();
    results.push(...(payload.results || []));
    start_cursor = payload.has_more ? payload.next_cursor : undefined;
  } while (start_cursor);

  return results;
}

async function fetchNotionProposal(brand) {
  let results;
  try {
    results = await queryNotionProposalRows();
  } catch (err) {
    console.error('[notion] brand query threw:', err && err.message);
    return null;
  }
  if (!results) {
    return null;
  }

  const target = slugify(brand);
  const page = results.find(item => {
    const data = normalizeNotionPage(item);
    return slugify(data.brand_name) === target;
  });

  return page ? cleanProposal(normalizeNotionPage(page)) : null;
}

async function fetchNotionProposalById(proposalId) {
  const token = process.env.NOTION_TOKEN;
  const target = String(proposalId || '').trim();
  if (!target || !token) {
    return { proposal: null, reason: !token ? 'NOTION_TOKEN missing' : 'empty id' };
  }

  const dataSourceId = await resolveNotionDataSourceId(token);
  if (!dataSourceId) {
    return { proposal: null, reason: 'NOTION_DATA_SOURCE_ID missing or could not be resolved from NOTION_DATABASE_ID' };
  }

  const expected = {
    databaseId: process.env.NOTION_DATABASE_ID,
    dataSourceId
  };

  // 1) Notion page id: GET /pages/{id} (no row-count limit)
  if (isNotionUuidLike(target)) {
    const directPage = await retrieveNotionPage(target, token);
    if (directPage) {
      if (notionPageBelongsToConfigured(directPage, expected)) {
        return { proposal: cleanProposal(normalizeNotionPage(directPage)) };
      }
      console.error(
        `[notion] page ${target} found but parent ${JSON.stringify(directPage.parent)} ` +
          `does not match configured data source ${dataSourceId} / db ${expected.databaseId}`
      );
    }
  }

  // 2) Full data-source scan: match `id` property or page id
  let results;
  try {
    results = await queryNotionDataSourceAllRows(token, dataSourceId);
  } catch (err) {
    console.error('[notion] data source scan threw:', err && err.message);
    return { proposal: null, reason: 'Notion data source query failed (see server logs)' };
  }

  let page = results.find(item => {
    const data = normalizeNotionPage(item);
    return String(data.id || '').trim() === target;
  });

  if (!page && isNotionUuidLike(target)) {
    const targetNorm = normalizeNotionUuidForMatch(target);
    page = results.find(item => normalizeNotionUuidForMatch(item.id) === targetNorm);
  }

  if (page) {
    return { proposal: cleanProposal(normalizeNotionPage(page)) };
  }
  return {
    proposal: null,
    reason: `id not found in data source ${dataSourceId} (scanned ${results.length} rows)`
  };
}

/**
 * Returns the data_source_id to query against. Priority:
 *   1. NOTION_DATA_SOURCE_ID (preferred for 2025-09-03 multi-source DBs)
 *   2. Discover from NOTION_DATABASE_ID by calling GET /v1/databases/{id}
 *      and using the first entry of `data_sources`.
 * Result is cached in CACHED_DATA_SOURCE_ID for subsequent calls.
 */
async function resolveNotionDataSourceId(token) {
  if (CACHED_DATA_SOURCE_ID) return CACHED_DATA_SOURCE_ID;

  const explicit = (process.env.NOTION_DATA_SOURCE_ID || '').trim();
  if (explicit) {
    CACHED_DATA_SOURCE_ID = formatNotionIdForApi(explicit);
    return CACHED_DATA_SOURCE_ID;
  }

  const databaseId = (process.env.NOTION_DATABASE_ID || '').trim();
  if (!databaseId || !token) return null;

  const dbPathId = formatNotionIdForApi(databaseId);
  const response = await notionFetch(
    `https://api.notion.com/v1/databases/${dbPathId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION
      }
    },
    `GET /v1/databases/${dbPathId}`
  );

  if (!response.ok) return null;

  const payload = await response.json().catch(() => ({}));
  const dataSources = Array.isArray(payload.data_sources) ? payload.data_sources : [];
  if (dataSources.length === 0) {
    console.error(`[notion] database ${dbPathId} has no data_sources in response`);
    return null;
  }

  CACHED_DATA_SOURCE_ID = formatNotionIdForApi(dataSources[0].id);
  console.log(
    `[notion] resolved data_source_id ${CACHED_DATA_SOURCE_ID} from database ${dbPathId}` +
      (dataSources.length > 1 ? ` (using first of ${dataSources.length})` : '')
  );
  return CACHED_DATA_SOURCE_ID;
}

async function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  // Serve /dashboard2/* directly from DTC-dashboard-2 folder (no copy needed)
  if (pathname.startsWith('/dashboard2')) {
    let subPath = pathname === '/dashboard2' || pathname === '/dashboard2/' || pathname === '/dashboard2/index.html'
      ? '/FC Brand Dashboard.html'
      : pathname.slice('/dashboard2'.length);
    const filePath = path.normalize(path.join(DASHBOARD2_ROOT, subPath));
    if (!filePath.startsWith(DASHBOARD2_ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    try {
      const body = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('Not found'); }
    return;
  }

  const filePath = path.normalize(path.join(ROOT, pathname));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  // Vite-built bundles (e.g. /assets/*.js) live in dist/, project files in ROOT
  for (const candidate of [filePath, path.normalize(path.join(DIST_ROOT, pathname))]) {
    try {
      const body = await fs.readFile(candidate);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(body);
      return;
    } catch (error) {
      // try next candidate
    }
  }
  res.writeHead(404);
  res.end('Not found');
}

/**
 * Customer sample links are served at short /p/{sn} (and legacy /gift-proposal/{sn}).
 * Status comes from Supabase magnet_brand_param:
 *   status 3 → live deal room (post-meeting.html)
 *   anything else / missing → sample deck (gift-challenge-react.html)
 * The browser URL never redirects; only the HTML body changes.
 */
const GIFT_PROPOSAL_ROUTE_RE = /^\/(?:gift-proposal|p)(?:\/([^/?#]+))?\/?$/;

const {
  lookupSamplePhase,
  loadPilotQuote,
  savePilotAddress,
  createPilotOrder,
  loadOrderInvoice,
  createFinanceHandoff,
  getFinanceHandoff,
  updateFinanceHandoffStatus,
  createStripeCheckoutForOrder,
  createStripeCheckoutFromQuote,
  verifyStripeSignature,
  markOrderPaidFromStripeSession,
  deliverFinanceEmail,
  stripeWebhookSecret,
  moneyRound,
} = commerce;

async function serveDistHtml(res, fileName, missingMessage) {
  try {
    const body = await fs.readFile(path.join(DIST_ROOT, fileName));
    res.writeHead(200, {
      'Content-Type': MIME_TYPES['.html'],
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500);
    res.end(missingMessage);
  }
}

async function serveGiftChallenge(res) {
  await serveDistHtml(
    res,
    'gift-challenge-react.html',
    'Failed to load gift challenge proposal (run `npm run build` to generate dist/)'
  );
}

async function servePostMeeting(res) {
  await serveDistHtml(
    res,
    'post-meeting.html',
    'Failed to load post-meeting deal room (run `npm run build` to generate dist/)'
  );
}

/** Serve sample or live HTML for /p/{sn} without changing the request URL. */
async function serveSampleOrLiveBySn(res, sn) {
  const { phase } = await lookupSamplePhase(sn);
  if (phase === 'live') {
    await servePostMeeting(res);
    return;
  }
  await serveGiftChallenge(res);
}

function apiErrorStatus(error) {
  return error.status || (error.code === 'supabase_unconfigured' ? 503 : 500);
}

/** Map DB invoice into the OrderState shape FinanceView / App expect. */
function invoiceToClientOrder(invoice, handoff) {
  const lineItems = (invoice.items || []).map((item) => ({
    id: String(item.id),
    label: item.name,
    amount: item.subtotal,
    kind: item.type === 'discount' ? 'discount' : 'standard',
  }));

  const discountItem = (invoice.items || []).find((item) => item.type === 'discount');
  const magnetsAmount = Number(invoice.amount) || 0;
  const discountAbs = discountItem ? Math.abs(Number(discountItem.subtotal) || 0) : 0;
  const percentOff = magnetsAmount > 0 && discountAbs > 0 ? Math.round((discountAbs / magnetsAmount) * 100) : 0;

  const status =
    invoice.uiStatus === 'paid'
      ? 'paid'
      : handoff?.status === 'paid'
        ? 'paid'
      : handoff?.status === 'payment_pending'
        ? 'payment_pending'
        : handoff?.status === 'viewed'
          ? 'viewed_by_finance'
          : handoff
            ? 'sent_to_finance'
            : invoice.uiStatus === 'approved'
              ? 'approved'
              : 'ready_for_approval';

  return {
    status,
    orderNumber: invoice.orderNo,
    invoiceNumber: invoice.invoiceNumber,
    version: 1,
    quantity: invoice.quantity,
    currency: invoice.currency || 'USD',
    unitPrice: invoice.unitPrice,
    tax: invoice.taxFee || 0,
    offerStartedAt: '',
    offerExpiresAt: '',
    package: {
      id: invoice.packageCode || 'pilot',
      code: invoice.packageCode || undefined,
      name: invoice.packageName,
      description: '',
      campaignType: invoice.packageName,
      serviceModel: 'Fully managed by FridgeChannel',
      features: [],
      integrations: [],
      includedServices: [],
    },
    lineItems,
    scopeIncluded: [],
    scopeExcluded: [],
    timeline: [],
    estimatedLaunch: '',
    paymentTerms: 'Due on receipt',
    approval: invoice.approval || undefined,
    financeHandoff: handoff
      ? {
          token: handoff.token,
          email: handoff.email,
          name: handoff.name,
          status: handoff.status,
          paymentUrl: handoff.paymentUrl || '',
          sentAt: handoff.sentAt,
          viewedAt: handoff.viewedAt,
          expiresAt: handoff.expiresAt,
        }
      : undefined,
    shippingAddress: invoice.shippingAddress
      ? {
          recipientName: invoice.shippingAddress.recipientName,
          companyName: '',
          addressLine1: invoice.shippingAddress.addressLine1,
          addressLine2: invoice.shippingAddress.addressLine2 || '',
          city: invoice.shippingAddress.city,
          state: invoice.shippingAddress.state,
          postalCode: invoice.shippingAddress.postalCode,
          country: invoice.shippingAddress.country,
          phone: invoice.shippingAddress.phone,
        }
      : {
          recipientName: '',
          companyName: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
          phone: '',
        },
    billing: {
      companyName: '',
      contactName: invoice.approval?.name || '',
      email: handoff?.email || invoice.approval?.email || '',
      address: invoice.shippingAddress?.formattedAddress || '',
      poNumber: '',
    },
    paymentMethod: 'card',
    paidAt: invoice.paymentTime || undefined,
    pricing: {
      loaded: true,
      magnetSn: invoice.magnetSn,
      minQuantity: invoice.quantity,
      discountRatio: percentOff > 0 ? moneyRound(1 - percentOff / 100) : 1,
      discountPercentOff: percentOff,
      discountActive: percentOff > 0,
      discountId: invoice.discountId,
      taxLabel: 'Not collected',
      taxCollected: false,
    },
    dbOrderId: invoice.orderId,
    shippingAddressId: invoice.shippingAddress?.id || null,
  };
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  // Stripe webhook needs the raw body for signature verification.
  if (requestUrl.pathname === '/api/stripe/webhook' && req.method === 'POST') {
    try {
      const rawBody = await readRawBody(req);
      verifyStripeSignature(rawBody, req.headers['stripe-signature'], stripeWebhookSecret());
      const event = JSON.parse(rawBody);
      if (event.type === 'checkout.session.completed') {
        const result = await markOrderPaidFromStripeSession(event.data.object);
        await sendJson(res, 200, { received: true, result });
        return;
      }
      await sendJson(res, 200, { received: true, ignored: event.type });
    } catch (error) {
      await sendJson(res, apiErrorStatus(error), { error: error.message || 'Webhook failed.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-orders/address' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const sn = typeof body.sn === 'string' ? body.sn.trim() : '';
      if (!sn) return sendJson(res, 400, { error: 'sn is required.' });
      const address = await savePilotAddress({ sn, address: body.address || body });
      await sendJson(res, 201, { address });
    } catch (error) {
      await sendJson(res, apiErrorStatus(error), { error: error.message || 'Unable to save address.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-orders' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const sn = typeof body.sn === 'string' ? body.sn.trim() : '';
      if (!sn) return sendJson(res, 400, { error: 'sn is required.' });
      const result = await createPilotOrder({
        sn,
        quantity: body.quantity,
        shippingAddressId: body.shippingAddressId,
        approval: body.approval,
      });
      await sendJson(res, 201, {
        orderId: result.orderId,
        orderNo: result.orderNo,
        totals: result.totals,
      });
    } catch (error) {
      await sendJson(res, apiErrorStatus(error), { error: error.message || 'Unable to create order.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/finance-handoffs' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const orderId = body.orderId;
      if (!orderId) return sendJson(res, 400, { error: 'orderId is required.' });
      if (!validEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid finance email.' });
      let baseUrl;
      try {
        baseUrl = normalizeBaseUrl(body.baseUrl || `${requestUrl.protocol}//${req.headers.host}`);
      } catch {
        return sendJson(res, 400, { error: 'Invalid proposal URL.' });
      }

      const { handoff, invoice } = await createFinanceHandoff({
        orderId,
        email: body.email,
        name: body.name || '',
        message: body.message || '',
        ccEmail: body.ccEmail || '',
        baseUrl,
      });

      const delivery = await deliverFinanceEmail({
        to: handoff.email,
        cc: body.ccEmail,
        financeName: handoff.name,
        approverName: invoice.approval?.name || 'Approver',
        invoice,
        paymentUrl: handoff.paymentUrl,
        message: body.message || '',
      });

      if (delivery.status === 'preview') {
        handoff.status = 'preview';
      }

      await sendJson(res, 201, { handoff });
    } catch (error) {
      await sendJson(res, apiErrorStatus(error), { error: error.message || 'Unable to send finance handoff.', code: error.code });
    }
    return;
  }

  const handoffMatch = requestUrl.pathname.match(/^\/api\/finance-handoffs\/([a-f0-9]{48})$/);
  if (handoffMatch) {
    if (!['GET', 'PATCH'].includes(req.method)) {
      await sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }
    try {
      if (req.method === 'PATCH') {
        const body = await readJsonBody(req);
        const updated = await updateFinanceHandoffStatus(handoffMatch[1], body.status);
        await sendJson(res, 200, {
          order: invoiceToClientOrder(updated.invoice, updated.handoff),
          invoice: updated.invoice,
          handoff: updated.handoff,
        });
        return;
      }

      const loaded = await getFinanceHandoff(handoffMatch[1]);
      // Auto-mark viewed on first GET if still sent/preview.
      if (loaded.handoff.status === 'sent' || loaded.handoff.status === 'preview') {
        const updated = await updateFinanceHandoffStatus(handoffMatch[1], 'viewed');
        await sendJson(res, 200, {
          order: invoiceToClientOrder(updated.invoice, {
            ...updated.handoff,
            paymentUrl: `${requestUrl.protocol}//${req.headers.host}/p/${encodeURIComponent(updated.handoff.magnetSn || '')}?finance=${updated.handoff.token}#finance`,
          }),
          invoice: updated.invoice,
          handoff: {
            ...updated.handoff,
            paymentUrl: `${requestUrl.protocol}//${req.headers.host}/p/${encodeURIComponent(updated.handoff.magnetSn || '')}?finance=${updated.handoff.token}#finance`,
          },
        });
        return;
      }

      await sendJson(res, 200, {
        order: invoiceToClientOrder(loaded.invoice, {
          ...loaded.handoff,
          paymentUrl: `${requestUrl.protocol}//${req.headers.host}/p/${encodeURIComponent(loaded.handoff.magnetSn || '')}?finance=${loaded.handoff.token}#finance`,
        }),
        invoice: loaded.invoice,
        handoff: {
          ...loaded.handoff,
          paymentUrl: `${requestUrl.protocol}//${req.headers.host}/p/${encodeURIComponent(loaded.handoff.magnetSn || '')}?finance=${loaded.handoff.token}#finance`,
        },
      });
    } catch (error) {
      await sendJson(res, apiErrorStatus(error), { error: error.message || 'Finance handoff unavailable.', code: error.code });
    }
    return;
  }

  // Phase lookup for Vite middleware and debugging: GET /api/sample-phase?sn=
  if (requestUrl.pathname === '/api/sample-phase') {
    if (req.method !== 'GET') {
      await sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }
    const sn = requestUrl.searchParams.get('sn') || '';
    const result = await lookupSamplePhase(sn);
    await sendJson(res, 200, result);
    return;
  }

  // Live deal-room pricing from DB. Display-only — never accept client-supplied prices.
  if (requestUrl.pathname === '/api/pilot-quote') {
    if (req.method !== 'GET') {
      await sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }
    try {
      const sn = requestUrl.searchParams.get('sn') || '';
      const quote = await loadPilotQuote(sn);
      await sendJson(res, 200, { quote });
    } catch (error) {
      await sendJson(res, apiErrorStatus(error), { error: error.message || 'Unable to load pilot quote.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-orders' && req.method === 'GET') {
    try {
      const orderId = requestUrl.searchParams.get('orderId');
      if (!orderId) return sendJson(res, 400, { error: 'orderId is required.' });
      const invoice = await loadOrderInvoice(orderId);
      await sendJson(res, 200, { invoice, order: invoiceToClientOrder(invoice) });
    } catch (error) {
      await sendJson(res, apiErrorStatus(error), { error: error.message || 'Unable to load order.', code: error.code });
    }
    return;
  }

  // Stripe Checkout: prefer { orderId }; legacy { sn, quantity } still allowed.
  if (requestUrl.pathname === '/api/stripe/checkout' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      let baseUrl;
      try {
        baseUrl = normalizeBaseUrl(body.baseUrl || `${requestUrl.protocol}//${req.headers.host}`);
      } catch {
        return sendJson(res, 400, { error: 'Invalid base URL.' });
      }

      if (body.orderId) {
        const session = await createStripeCheckoutForOrder({
          orderId: body.orderId,
          baseUrl,
          handoffToken: body.financeToken || body.handoffToken || '',
        });
        await sendJson(res, 200, { url: session.url, id: session.id, invoice: session.invoice });
        return;
      }

      const sn = typeof body.sn === 'string' ? body.sn.trim() : '';
      if (!sn) return sendJson(res, 400, { error: 'orderId or sn is required.' });
      const session = await createStripeCheckoutFromQuote({ sn, quantity: body.quantity, baseUrl });
      await sendJson(res, 200, { url: session.url, id: session.id, totals: session.totals });
    } catch (error) {
      await sendJson(res, apiErrorStatus(error), { error: error.message || 'Unable to create checkout session.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/' || requestUrl.pathname === '/gift-challenge-react.html') {
    await serveGiftChallenge(res);
    return;
  }

  // Explicit live entry still served directly (finance handoffs, bookmarks).
  if (requestUrl.pathname === '/post-meeting.html') {
    await servePostMeeting(res);
    return;
  }

  const proposalRouteMatch = requestUrl.pathname.match(GIFT_PROPOSAL_ROUTE_RE);
  if (proposalRouteMatch) {
    const sn = proposalRouteMatch[1] ? decodeURIComponent(proposalRouteMatch[1]) : '';
    // Bare /p or /gift-proposal → sample deck; /p/{sn} chooses sample vs live from Supabase.
    if (!sn) {
      await serveGiftChallenge(res);
      return;
    }
    await serveSampleOrLiveBySn(res, sn);
    return;
  }

  if (requestUrl.pathname === '/api/proposal') {
    const id = requestUrl.searchParams.get('id');
    const brand = requestUrl.searchParams.get('brand');

    try {
      if (id) {
        try {
          const proposal = await loadFallbackProposalById(id);
          await sendJson(res, 200, proposal);
          return;
        } catch (error) {
          await sendJson(res, 404, {
            error: 'Proposal not found',
            id,
            hint: 'Add this id or a matching route_aliases value to a JSON file in data/proposals.'
          });
          return;
        }
      }

      if (!brand) {
        const proposal = await loadFallbackProposal('Nike');
        await sendJson(res, 200, proposal);
        return;
      }

      const proposal = await loadFallbackProposal(brand);
      await sendJson(res, 200, proposal);
    } catch (error) {
      console.error('[api/proposal] unexpected error:', error && error.message);
      try {
        let proposal;
        if (brand) {
          proposal = await loadFallbackProposal(brand);
        } else {
          proposal = await loadFallbackProposal('Nike');
        }
        await sendJson(res, 200, proposal);
      } catch (fallbackError) {
        const status = brand ? 404 : 500;
        await sendJson(res, status, {
          error: brand ? 'Proposal not found' : error.message
        });
      }
    }
    return;
  }

  await serveStatic(req, res);
}

if (require.main === module) {
  loadDotEnv().then(() => {
  const port = Number(process.env.PORT || 4173);
    const server = http.createServer(handleRequest);

    server.listen(port, () => {
      console.log(`Proposal server running at http://localhost:${port}`);
    });
  });
}

module.exports = async function handler(req, res) {
  await loadDotEnv();
  return handleRequest(req, res);
};
