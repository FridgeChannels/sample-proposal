const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const {
  lookupSamplePhase,
  getFinanceHandoff,
  updateFinanceHandoffStatus,
  moneyRound,
} = require('./pilot-commerce');

const ROOT = __dirname;
const DIST_ROOT = path.join(__dirname, 'dist');
const DASHBOARD2_ROOT = path.join(require('os').homedir(), 'Downloads', 'DTC-dashboard-2');

const FINANCE_HANDOFFS = new Map();
const FINANCE_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000;

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw || raw.length > 1_000_000) throw new Error('Invalid request body');
  return JSON.parse(raw);
}

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

function slugify(value) {
  return String(value || 'nike').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'nike';
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
    invoice.uiStatus === 'paid' || handoff?.status === 'paid'
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

function paymentUrlForHandoff(req, requestUrl, handoff) {
  const sn = handoff.magnetSn || '';
  const hostBase = `${requestUrl.protocol}//${req.headers.host}`;
  return sn
    ? `${hostBase}/p/${encodeURIComponent(sn)}?finance=${handoff.token}#finance`
    : `${hostBase}/post-meeting.html?finance=${handoff.token}#finance`;
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/api/finance-handoffs' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.order) return sendJson(res, 400, { error: 'Missing order details.' });
      const total = Number(body.total);
      if (!Number.isFinite(total) || total <= 0) return sendJson(res, 400, { error: 'Invalid order total.' });
      const token = crypto.randomBytes(24).toString('hex');
      let baseUrl;
      try { baseUrl = normalizeBaseUrl(body.baseUrl); }
      catch { return sendJson(res, 400, { error: 'Invalid proposal URL.' }); }
      let paymentLocation;
      try {
        paymentLocation = new URL(body.proposalPath || '/post-meeting.html', baseUrl);
        if (paymentLocation.origin !== baseUrl) throw new Error('Invalid proposal path.');
      } catch {
        return sendJson(res, 400, { error: 'Invalid proposal path.' });
      }
      paymentLocation.search = '';
      paymentLocation.searchParams.set('finance', token);
      paymentLocation.hash = 'finance';
      const paymentUrl = paymentLocation.toString();
      const createdAt = new Date().toISOString();
      const record = { token, order: body.order, total, status: 'payment_pending', paymentUrl, createdAt, expiresAt: new Date(Date.now() + FINANCE_LINK_TTL_MS).toISOString() };
      FINANCE_HANDOFFS.set(token, record);
      await sendJson(res, 201, { handoff: { token, status: record.status, paymentUrl, sentAt: createdAt, expiresAt: record.expiresAt } });
    } catch (error) { await sendJson(res, 500, { error: error.message || 'Unable to send finance handoff.' }); }
    return;
  }

  const handoffMatch = requestUrl.pathname.match(/^\/api\/finance-handoffs\/([a-f0-9]{48})$/);
  if (handoffMatch) {
    if (!['GET', 'PATCH'].includes(req.method)) { await sendJson(res, 405, { error: 'Method not allowed.' }); return; }

    // Prefer in-memory (current session), then Supabase finance_handoff (survives restarts).
    const memory = FINANCE_HANDOFFS.get(handoffMatch[1]);
    if (memory) {
      if (Date.now() > Date.parse(memory.expiresAt)) {
        memory.status = 'expired';
        await sendJson(res, 410, { error: 'This finance link has expired.' });
        return;
      }
      if (req.method === 'PATCH') {
        try {
          const body = await readJsonBody(req);
          const allowed = ['payment_pending', 'paid', 'revoked'];
          if (!allowed.includes(body.status)) return sendJson(res, 400, { error: 'Invalid handoff status.' });
          memory.status = body.status;
        } catch (error) {
          await sendJson(res, 400, { error: 'Invalid status update.' });
          return;
        }
      }
      await sendJson(res, 200, {
        order: memory.order,
        handoff: {
          token: memory.token,
          status: memory.status,
          paymentUrl: memory.paymentUrl,
          sentAt: memory.createdAt,
          expiresAt: memory.expiresAt,
        },
      });
      return;
    }

    try {
      if (req.method === 'PATCH') {
        const body = await readJsonBody(req);
        const updated = await updateFinanceHandoffStatus(handoffMatch[1], body.status);
        const paymentUrl = paymentUrlForHandoff(req, requestUrl, updated.handoff);
        await sendJson(res, 200, {
          order: invoiceToClientOrder(updated.invoice, { ...updated.handoff, paymentUrl }),
          invoice: updated.invoice,
          handoff: { ...updated.handoff, paymentUrl },
        });
        return;
      }

      let loaded = await getFinanceHandoff(handoffMatch[1]);
      if (loaded.handoff.status === 'sent' || loaded.handoff.status === 'preview') {
        loaded = await updateFinanceHandoffStatus(handoffMatch[1], 'viewed');
      }
      const paymentUrl = paymentUrlForHandoff(req, requestUrl, loaded.handoff);
      await sendJson(res, 200, {
        order: invoiceToClientOrder(loaded.invoice, { ...loaded.handoff, paymentUrl }),
        invoice: loaded.invoice,
        handoff: { ...loaded.handoff, paymentUrl },
      });
    } catch (error) {
      const status = error.status || 500;
      await sendJson(res, status, { error: error.message || 'Finance handoff unavailable.', code: error.code });
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
