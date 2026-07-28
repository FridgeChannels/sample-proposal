const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DIST_ROOT = path.join(__dirname, 'dist');
const DASHBOARD2_ROOT = path.join(require('os').homedir(), 'Downloads', 'DTC-dashboard-2');
const NOTION_VERSION = '2025-09-03';

// Legacy Notion helpers remain for compatibility, but proposal routes no longer call them.
let CACHED_DATA_SOURCE_ID = null;
const FINANCE_HANDOFFS = new Map();
const FINANCE_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000;

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw || raw.length > 1_000_000) throw new Error('Invalid request body');
  return JSON.parse(raw);
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

async function deliverFinanceEmail({ to, cc, financeName, requesterName, order, total, paymentUrl, message }) {
  if (!process.env.RESEND_API_KEY) return { status: 'preview', providerId: null };
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FINANCE_FROM_EMAIL || 'FridgeChannel <orders@fridgechannel.com>',
      to: [to], cc: cc ? [cc] : undefined,
      subject: `Payment requested for FridgeChannel order ${order.orderNumber}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#14281f"><p>Hi ${escapeHtml(financeName || 'Finance team')},</p><p><strong>${escapeHtml(requesterName)}</strong> asked you to review this FridgeChannel order and complete payment.</p><hr><p>Order: <strong>${escapeHtml(order.orderNumber)}</strong><br>Package: <strong>${escapeHtml(order.package.name)}</strong><br>Quantity: <strong>${order.quantity.toLocaleString()} NFC magnets</strong></p><p style="font-size:30px">${formattedTotal}</p>${message ? `<p>${escapeHtml(message)}</p>` : ''}<p><a href="${escapeHtml(paymentUrl)}" style="display:inline-block;padding:14px 20px;background:#0b3a28;color:white;text-decoration:none">Review &amp; Pay Invoice →</a></p><p style="color:#66736d;font-size:12px">This secure link expires in 14 days.</p></div>`
    })
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  const result = await response.json();
  return { status: 'sent', providerId: result.id || null };
}

async function loadDotEnv() {
  const envPaths = [path.join(ROOT, '.env'), path.join(ROOT, '..', '.env')];

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
 * Gift challenge decks are served from the built React page
 * (dist/gift-challenge-react.html) via:
 *   /  or  /gift-proposal/{id}  or short /p/{id}
 * The front-end reads `id` from the URL and calls /api/proposal?id=... internally.
 */
const GIFT_PROPOSAL_ROUTE_RE = /^\/(?:gift-proposal|p)(?:\/([^/?#]+))?\/?$/;

async function serveGiftChallenge(res) {
  try {
    const body = await fs.readFile(path.join(DIST_ROOT, 'gift-challenge-react.html'));
    res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
    res.end(body);
  } catch (error) {
    res.writeHead(500);
    res.end('Failed to load gift challenge proposal (run `npm run build` to generate dist/)');
  }
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/api/finance-handoffs' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const requester = body.order?.viewer || (body.order?.approval ? { name: body.order.approval.name, email: body.order.approval.email } : null);
      if (!body.order || !requester) return sendJson(res, 409, { error: 'Sign in before sending this order to finance.' });
      if (!validEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid finance email.' });
      const total = Number(body.total);
      if (!Number.isFinite(total) || total <= 0) return sendJson(res, 400, { error: 'Invalid order total.' });
      const token = crypto.randomBytes(24).toString('hex');
      let baseUrl;
      try { baseUrl = normalizeBaseUrl(body.baseUrl); }
      catch { return sendJson(res, 400, { error: 'Invalid proposal URL.' }); }
      const paymentUrl = `${baseUrl}/post-meeting.html?finance=${token}#finance`;
      const createdAt = new Date().toISOString();
      const record = { token, order: body.order, total, email: body.email, name: body.name || '', message: body.message || '', status: 'sending', paymentUrl, createdAt, expiresAt: new Date(Date.now() + FINANCE_LINK_TTL_MS).toISOString(), providerId: null };
      FINANCE_HANDOFFS.set(token, record);
      const delivery = await deliverFinanceEmail({ to: body.email, cc: body.ccEmail, financeName: body.name, requesterName: requester.name || requester.email, order: body.order, total, paymentUrl, message: body.message });
      Object.assign(record, delivery);
      record.status = 'payment_pending';
      await sendJson(res, 201, { handoff: { token, email: record.email, name: record.name, status: record.status, paymentUrl, sentAt: createdAt, expiresAt: record.expiresAt } });
    } catch (error) { await sendJson(res, 500, { error: error.message || 'Unable to send finance handoff.' }); }
    return;
  }

  const handoffMatch = requestUrl.pathname.match(/^\/api\/finance-handoffs\/([a-f0-9]{48})$/);
  if (handoffMatch) {
    if (!['GET', 'PATCH'].includes(req.method)) { await sendJson(res, 405, { error: 'Method not allowed.' }); return; }
    const record = FINANCE_HANDOFFS.get(handoffMatch[1]);
    if (!record) { await sendJson(res, 404, { error: 'Finance link not found or no longer available.' }); return; }
    if (Date.now() > Date.parse(record.expiresAt)) { record.status = 'expired'; await sendJson(res, 410, { error: 'This finance link has expired.' }); return; }
    if (req.method === 'PATCH') {
      try {
        const body = await readJsonBody(req);
        const allowed = ['payment_pending', 'paid', 'revoked'];
        if (!allowed.includes(body.status)) return sendJson(res, 400, { error: 'Invalid handoff status.' });
        record.status = body.status;
      } catch (error) { await sendJson(res, 400, { error: 'Invalid status update.' }); return; }
    }
    await sendJson(res, 200, { order: record.order, handoff: { token: record.token, email: record.email, name: record.name, status: record.status, paymentUrl: record.paymentUrl, sentAt: record.createdAt, expiresAt: record.expiresAt } });
    return;
  }

  if (requestUrl.pathname === '/' || requestUrl.pathname === '/gift-challenge-react.html') {
    await serveGiftChallenge(res);
    return;
  }

  if (GIFT_PROPOSAL_ROUTE_RE.test(requestUrl.pathname)) {
    await serveGiftChallenge(res);
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
