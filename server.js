const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const {
  lookupSamplePhase,
  loadPilotQuote,
  computePilotTotals,
  savePilotAddress,
  createPilotOrder,
  updateOrderShipping,
  createFinanceHandoff,
  getFinanceHandoff,
  updateFinanceHandoffStatus,
  createStripeInvoiceForOrder,
  moneyRound,
} = require('./pilot-commerce');

const ROOT = __dirname;
const DIST_ROOT = path.join(__dirname, 'dist');
const DASHBOARD2_ROOT = path.join(require('os').homedir(), 'Downloads', 'DTC-dashboard-2');

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
      // .env is optional
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
  if (!target) throw new Error('Missing proposal id');
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
  for (const candidate of [filePath, path.normalize(path.join(DIST_ROOT, pathname))]) {
    try {
      const body = await fs.readFile(candidate);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(body);
      return;
    } catch (error) {
      // try next
    }
  }
  res.writeHead(404);
  res.end('Not found');
}

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
  await serveDistHtml(res, 'gift-challenge-react.html', 'Failed to load gift challenge proposal (run `npm run build` to generate dist/)');
}

async function servePostMeeting(res) {
  await serveDistHtml(res, 'post-meeting.html', 'Failed to load post-meeting deal room (run `npm run build` to generate dist/)');
}

async function serveSampleOrLiveBySn(res, sn) {
  const { phase } = await lookupSamplePhase(sn);
  if (phase === 'live') {
    await servePostMeeting(res);
    return;
  }
  await serveGiftChallenge(res);
}

function invoiceToClientOrder(invoice, handoff, quoteExtras = {}) {
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
    offerStartedAt: quoteExtras.offerStartedAt || '',
    offerExpiresAt: quoteExtras.offerExpiresAt || '',
    brandName: quoteExtras.brandName || '',
    createdAt: quoteExtras.customerCreatedAt || '',
    package: {
      id: invoice.packageCode || quoteExtras.packageId || 'pilot',
      code: invoice.packageCode || quoteExtras.packageCode || undefined,
      name: invoice.packageName,
      description: quoteExtras.packageDescription || '',
      campaignType: invoice.packageName,
      serviceModel: 'Fully managed by FridgeChannel',
      features: [],
      integrations: [],
      includedServices: quoteExtras.includedServices || [],
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
          companyName: quoteExtras.brandName || '',
          addressLine1: invoice.shippingAddress.addressLine1,
          addressLine2: invoice.shippingAddress.addressLine2 || '',
          city: invoice.shippingAddress.city,
          state: invoice.shippingAddress.state,
          postalCode: invoice.shippingAddress.postalCode,
          country: invoice.shippingAddress.country,
          phone: invoice.shippingAddress.phone,
          email: invoice.shippingAddress.email || '',
        }
      : {
          recipientName: '',
          companyName: quoteExtras.brandName || '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
          phone: '',
          email: '',
        },
    billing: {
      companyName: quoteExtras.brandName || '',
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

/**
 * Public origin of the request. Behind the Vite dev proxy (and any reverse
 * proxy) req.headers.host is the internal target, so forwarded headers win.
 */
function publicOrigin(req, requestUrl) {
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const host = forwardedHost || req.headers.host;
  const protocol = forwardedProto ? `${forwardedProto}:` : requestUrl.protocol;
  return `${protocol}//${host}`;
}

function paymentUrlForHandoff(hostBase, handoff) {
  const sn = handoff.magnetSn || '';
  return sn
    ? `${hostBase}/p/${encodeURIComponent(sn)}?finance=${handoff.token}#finance`
    : `${hostBase}/post-meeting.html?finance=${handoff.token}#finance`;
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/api/pilot-quote' && req.method === 'GET') {
    try {
      const sn = requestUrl.searchParams.get('sn') || '';
      const quote = await loadPilotQuote(sn);
      const totals = computePilotTotals(quote);
      await sendJson(res, 200, { quote, totals });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to load pilot quote.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-orders/address' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const sn = String(body.sn || '').trim();
      if (!sn) return sendJson(res, 400, { error: 'Magnet SN is required.' });
      if (!body.address) return sendJson(res, 400, { error: 'Address is required.' });
      const saved = await savePilotAddress({ sn, address: body.address });
      await sendJson(res, 201, { address: saved });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to save address.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-orders/shipping' && req.method === 'PATCH') {
    try {
      const body = await readJsonBody(req);
      const orderId = Number(body.orderId);
      const shippingAddressId = Number(body.shippingAddressId);
      const result = await updateOrderShipping({ orderId, shippingAddressId });
      await sendJson(res, 200, result);
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to update shipping.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/stripe/invoices' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const orderId = Number(body.orderId);
      const paymentEmail = String(body.paymentEmail || '').trim();
      const handoffToken = body.handoffToken ? String(body.handoffToken).trim() : undefined;
      if (!Number.isFinite(orderId)) return sendJson(res, 400, { error: 'orderId is required.' });
      if (!paymentEmail.includes('@')) return sendJson(res, 400, { error: 'A valid payment email is required.' });

      const result = await createStripeInvoiceForOrder({
        orderId,
        paymentEmail,
        handoffToken,
        payerName: body.payerName ? String(body.payerName).trim() : undefined,
      });
      await sendJson(res, 200, {
        invoiceId: result.id,
        hostedInvoiceUrl: result.hostedInvoiceUrl,
        reused: result.reused,
      });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to create Stripe invoice.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/finance-handoffs' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const sn = String(body.sn || '').trim();
      if (!sn) return sendJson(res, 400, { error: 'Magnet SN is required.' });

      const quote = await loadPilotQuote(sn);
      const created = await createPilotOrder({ sn, quantity: body.quantity });
      const toEmail = String(body.toEmail || quote.customerEmail || '').trim();
      if (!toEmail.includes('@')) {
        return sendJson(res, 400, { error: 'Customer email is missing; configure customer.email before creating a finance link.' });
      }

      const handoff = await createFinanceHandoff({
        orderId: created.orderId,
        magnetSn: sn,
        toEmail,
        toName: quote.brandName || undefined,
      });

      let baseUrl;
      try { baseUrl = normalizeBaseUrl(body.baseUrl || publicOrigin(req, requestUrl)); }
      catch { return sendJson(res, 400, { error: 'Invalid proposal URL.' }); }

      const paymentUrl = paymentUrlForHandoff(baseUrl, { token: handoff.token, magnetSn: sn });

      await sendJson(res, 201, {
        handoff: { ...handoff, paymentUrl },
        orderId: created.orderId,
        orderNo: created.orderNo,
        totals: created.totals,
      });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to create finance handoff.', code: error.code });
    }
    return;
  }

  const handoffMatch = requestUrl.pathname.match(/^\/api\/finance-handoffs\/([a-f0-9]{48})$/);
  if (handoffMatch) {
    if (!['GET', 'PATCH'].includes(req.method)) { await sendJson(res, 405, { error: 'Method not allowed.' }); return; }

    try {
      if (req.method === 'PATCH') {
        const body = await readJsonBody(req);
        const updated = await updateFinanceHandoffStatus(handoffMatch[1], body.status);
        const paymentUrl = paymentUrlForHandoff(publicOrigin(req, requestUrl), updated.handoff);
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
      const paymentUrl = paymentUrlForHandoff(publicOrigin(req, requestUrl), loaded.handoff);

      let quoteExtras = {};
      if (loaded.invoice.magnetSn) {
        try {
          const quote = await loadPilotQuote(loaded.invoice.magnetSn);
          quoteExtras = {
            brandName: quote.brandName,
            customerCreatedAt: quote.customerCreatedAt,
            packageDescription: quote.package.description,
            packageId: quote.package.id,
            packageCode: quote.package.code,
            includedServices: quote.includedServices,
            offerExpiresAt: quote.discount.expiresAt || '',
          };
        } catch (error) {
          console.warn('[finance-handoff] quote enrich failed:', error.message);
        }
      }

      await sendJson(res, 200, {
        order: invoiceToClientOrder(loaded.invoice, { ...loaded.handoff, paymentUrl }, quoteExtras),
        invoice: loaded.invoice,
        handoff: { ...loaded.handoff, paymentUrl },
      });
    } catch (error) {
      const status = error.status || 500;
      await sendJson(res, status, { error: error.message || 'Finance handoff unavailable.', code: error.code });
    }
    return;
  }

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

  if (requestUrl.pathname === '/post-meeting.html') {
    await servePostMeeting(res);
    return;
  }

  const proposalRouteMatch = requestUrl.pathname.match(GIFT_PROPOSAL_ROUTE_RE);
  if (proposalRouteMatch) {
    const sn = proposalRouteMatch[1] ? decodeURIComponent(proposalRouteMatch[1]) : '';
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
