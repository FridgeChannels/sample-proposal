const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const {
  lookupSamplePhase,
  loadSampleProposalBySn,
  loadPilotQuote,
  computePilotTotals,
  savePilotAddress,
  savePilotBilling,
  createPilotOrder,
  updateOrderShipping,
  createFinanceHandoff,
  getFinanceHandoff,
  getFinanceReceiptPdf,
  updateFinanceHandoffStatus,
  createStripeInvoiceForOrder,
  savePilotPlan,
  ensureSampleLive,
  loadPilotSession,
  moneyRound,
} = require('./pilot-commerce');
const {
  listCalendlyEvents,
  resolvePilotSession,
  listPackages,
  createDashboardLoginLink,
  bindPilotCustomerAccount,
} = require('./pilot-session');
const {
  isAuthenticated,
  isPilotOpsLoginPath,
  isPilotOpsProtectedPath,
  redirectToLogin,
  handleAuthLogin,
  handleAuthLogout,
} = require('./pilot-ops-auth');
const { createChristmasCampaignApplication } = require('./christmas-campaign-notion');
const {
  clientIp,
  assertAllowedOrigin,
  assertRateLimits,
  assertTokenRateLimit,
  issueFormToken,
  assertFormToken,
  normalizeEmail,
  getRecentApplication,
  rememberApplication,
} = require('./christmas-campaign-security');

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
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
};

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
      const headers = { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' };
      if (ext === '.pdf') {
        headers['Content-Disposition'] = 'inline';
      }
      res.writeHead(200, headers);
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

async function serveDistHtml(res, fileName, missingMessage, { injectPublicConfig = false } = {}) {
  try {
    let body = await fs.readFile(
      path.join(DIST_ROOT, fileName),
      injectPublicConfig ? 'utf8' : undefined,
    );
    if (injectPublicConfig && typeof body === 'string') {
      const legalBase = String(process.env.VITE_LEGAL_DOCS_BASE_URL || process.env.LEGAL_DOCS_BASE_URL || '').replace(/\/$/, '');
      if (legalBase) {
        const injection = `<script>window.__FC_LEGAL_DOCS_BASE_URL__=${JSON.stringify(legalBase)};</script>`;
        body = body.replace('</head>', `${injection}</head>`);
      }
    }
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
  await serveDistHtml(
    res,
    'post-meeting.html',
    'Failed to load post-meeting deal room (run `npm run build` to generate dist/)',
    { injectPublicConfig: true },
  );
}

async function serveQualifiedMeetingDoc(res) {
  await serveDistHtml(
    res,
    'qualified-meeting-doc.html',
    'Failed to load QualifiedMeetingDoc (run `npm run build` to generate dist/)',
  );
}

async function serveFitMeetingSample(res) {
  await serveDistHtml(
    res,
    'fit-meeting-sample.html',
    'Failed to load Fit Meeting Sample (run `npm run build` to generate dist/)',
  );
}

async function serveFcAsinPlusSample(res) {
  await serveDistHtml(
    res,
    'fc-asin-plus-sample.html',
    'Failed to load FC-ASIN Plus Sample (run `npm run build` to generate dist/)',
  );
}

async function serveChristmasAsinCampaign(res) {
  await serveDistHtml(
    res,
    'christmas-asin-campaign.html',
    'Failed to load Christmas ASIN Campaign (run `npm run build` to generate dist/)',
  );
}

async function serveChristmasDtcCampaign(res) {
  await serveDistHtml(
    res,
    'christmas-dtc-campaign.html',
    'Failed to load Christmas DTC Campaign (run `npm run build` to generate dist/)',
  );
}

async function servePilotPlan(res) {
  await serveDistHtml(
    res,
    'pilot-plan.html',
    'Failed to load Pilot Plan proposal (run `npm run build` to generate dist/)',
  );
}

async function servePilotPlanPrep(res) {
  await serveDistHtml(
    res,
    'pilot-plan-prep.html',
    'Failed to load Pilot Plan prep (run `npm run build` to generate dist/)',
  );
}

async function servePilotPlanLogin(res) {
  try {
    const body = await fs.readFile(path.join(ROOT, 'public', 'pilot-plan-login.html'));
    res.writeHead(200, {
      'Content-Type': MIME_TYPES['.html'],
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500);
    res.end('Failed to load pilot plan login page.');
  }
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
  const lineItems = (invoice.items || []).filter((item) => item.type !== 'shipping').map((item) => ({
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
          firstName: invoice.shippingAddress.firstName || '',
          lastName: invoice.shippingAddress.lastName || '',
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
          firstName: '',
          lastName: '',
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
      companyName: invoice.billing?.companyName || '',
      contactName: invoice.billing?.contactName || invoice.approval?.name || '',
      address: invoice.billing?.address || '',
      jobTitle: invoice.billing?.jobTitle || '',
      email: invoice.billing?.email || '',
      poNumber: invoice.billing?.poNumber || '',
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
    shippingMethod: invoice.shippingMethod === 'air' ? 'air' : 'ocean',
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

function placesHttpError(message, status = 500, code = 'places_error') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function googlePlacesApiKey() {
  const key = String(process.env.GOOGLE_MAPS_API_KEY || '').trim();
  if (!key) throw placesHttpError('Address suggestions are not configured.', 503, 'places_not_configured');
  return key;
}

function normalizedPlacesSessionToken(value) {
  const token = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{1,36}$/.test(token)) {
    throw placesHttpError('A valid Places session token is required.', 400, 'invalid_session_token');
  }
  return token;
}

async function fetchGooglePlaces(url, options) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(6000),
    });
  } catch (error) {
    console.error('[google-places]', error?.message || 'Network request failed');
    throw placesHttpError('Address suggestions are temporarily unavailable.', 502, 'places_upstream_error');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[google-places]', response.status, data?.error?.message || 'Request failed');
    throw placesHttpError('Address suggestions are temporarily unavailable.', 502, 'places_upstream_error');
  }
  return data;
}

async function autocompleteAddresses({ input, sessionToken, country }) {
  const query = String(input || '').trim().slice(0, 200);
  if (query.length < 3) return [];

  const body = {
    input: query,
    sessionToken: normalizedPlacesSessionToken(sessionToken),
    languageCode: 'en',
  };
  const countryAliases = {
    'united states': 'us',
    'united states of america': 'us',
    usa: 'us',
    canada: 'ca',
    'united kingdom': 'gb',
    uk: 'gb',
    china: 'cn',
  };
  const rawCountry = String(country || '').trim().toLowerCase();
  const region = countryAliases[rawCountry] || rawCountry;
  if (/^[a-z]{2}$/.test(region)) {
    body.includedRegionCodes = [region];
    body.regionCode = region;
  }

  const data = await fetchGooglePlaces('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googlePlacesApiKey(),
      'X-Goog-FieldMask': [
        'suggestions.placePrediction.placeId',
        'suggestions.placePrediction.structuredFormat.mainText.text',
        'suggestions.placePrediction.structuredFormat.secondaryText.text',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  return (Array.isArray(data.suggestions) ? data.suggestions : [])
    .map(item => item?.placePrediction)
    .filter(Boolean)
    .slice(0, 5)
    .map(prediction => ({
      placeId: prediction.placeId,
      mainText: prediction.structuredFormat?.mainText?.text || '',
      secondaryText: prediction.structuredFormat?.secondaryText?.text || '',
    }))
    .filter(prediction => prediction.placeId && prediction.mainText);
}

function placeComponent(components, type, preferShort = false) {
  const component = components.find(item => Array.isArray(item.types) && item.types.includes(type));
  return component ? String((preferShort ? component.shortText : component.longText) || component.longText || '') : '';
}

async function resolvePlaceAddress({ placeId, sessionToken }) {
  const id = String(placeId || '').trim();
  if (!/^[A-Za-z0-9_-]{3,500}$/.test(id)) {
    throw placesHttpError('A valid place ID is required.', 400, 'invalid_place_id');
  }
  const token = normalizedPlacesSessionToken(sessionToken);
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`);
  url.searchParams.set('sessionToken', token);
  url.searchParams.set('languageCode', 'en');

  const data = await fetchGooglePlaces(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googlePlacesApiKey(),
      'X-Goog-FieldMask': 'addressComponents,formattedAddress',
    },
  });
  const components = Array.isArray(data.addressComponents) ? data.addressComponents : [];
  const streetNumber = placeComponent(components, 'street_number');
  const route = placeComponent(components, 'route');
  const premise = placeComponent(components, 'premise');
  const subpremise = placeComponent(components, 'subpremise');
  const city =
    placeComponent(components, 'locality') ||
    placeComponent(components, 'postal_town') ||
    placeComponent(components, 'sublocality_level_1') ||
    placeComponent(components, 'administrative_area_level_2');
  const state = placeComponent(components, 'administrative_area_level_1', true);
  const postalCode = [
    placeComponent(components, 'postal_code'),
    placeComponent(components, 'postal_code_suffix'),
  ].filter(Boolean).join('-');
  const country = placeComponent(components, 'country', true);
  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ') || premise || String(data.formattedAddress || '').split(',')[0];

  return {
    addressLine1,
    addressLine2: subpremise,
    city,
    state,
    postalCode,
    country,
    formattedAddress: data.formattedAddress || '',
  };
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/api/pilot-plan/auth' && req.method === 'POST') {
    await handleAuthLogin(req, res, readJsonBody, sendJson);
    return;
  }

  if (requestUrl.pathname === '/api/pilot-plan/logout' && req.method === 'POST') {
    await handleAuthLogout(req, res, sendJson);
    return;
  }

  if (isPilotOpsLoginPath(requestUrl.pathname)) {
    if (isAuthenticated(req)) {
      const returnTo = requestUrl.searchParams.get('return') || '/pilot-plan/prep';
      const safeReturn = String(returnTo).startsWith('/') ? returnTo : '/pilot-plan/prep';
      res.writeHead(302, { Location: safeReturn });
      res.end();
      return;
    }
    await servePilotPlanLogin(res);
    return;
  }

  if (isPilotOpsProtectedPath(requestUrl.pathname) && !isAuthenticated(req)) {
    if (requestUrl.pathname.startsWith('/api/')) {
      await sendJson(res, 401, { error: 'Authentication required.', code: 'pilot_ops_auth_required' });
      return;
    }
    redirectToLogin(res, `${requestUrl.pathname}${requestUrl.search}`);
    return;
  }

  if (requestUrl.pathname === '/api/places/autocomplete' && req.method === 'GET') {
    try {
      const suggestions = await autocompleteAddresses({
        input: requestUrl.searchParams.get('input'),
        sessionToken: requestUrl.searchParams.get('sessionToken'),
        country: requestUrl.searchParams.get('country'),
      });
      await sendJson(res, 200, { suggestions });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to suggest addresses.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/places/details' && req.method === 'GET') {
    try {
      const address = await resolvePlaceAddress({
        placeId: requestUrl.searchParams.get('placeId'),
        sessionToken: requestUrl.searchParams.get('sessionToken'),
      });
      await sendJson(res, 200, { address });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to resolve address.', code: error.code });
    }
    return;
  }

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
      const result = await updateOrderShipping({
        orderId,
        shippingAddressId,
        billing: body.billing || undefined,
        termsAccepted: Boolean(body.termsAccepted),
      });
      await sendJson(res, 200, result);
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to update shipping.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-orders/billing' && req.method === 'PATCH') {
    try {
      const body = await readJsonBody(req);
      const sn = String(body.sn || '').trim();
      if (!sn) return sendJson(res, 400, { error: 'Magnet SN is required.' });
      if (!body.billing) return sendJson(res, 400, { error: 'Billing details are required.' });
      const result = await savePilotBilling({ sn, billing: body.billing });
      await sendJson(res, 200, result);
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to save billing.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/stripe/invoices' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const orderId = Number(body.orderId);
      const handoffToken = body.handoffToken ? String(body.handoffToken).trim() : undefined;
      if (!Number.isFinite(orderId)) return sendJson(res, 400, { error: 'orderId is required.' });

      const result = await createStripeInvoiceForOrder({
        orderId,
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
      const created = await createPilotOrder({ sn, quantity: body.quantity, shippingMethod: body.shippingMethod });
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
  const receiptMatch = requestUrl.pathname.match(/^\/api\/finance-handoffs\/([a-f0-9]{48})\/receipt\.pdf$/);
  if (receiptMatch) {
    if (req.method !== 'GET') { await sendJson(res, 405, { error: 'Method not allowed.' }); return; }
    try {
      const receipt = await getFinanceReceiptPdf(receiptMatch[1]);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${receipt.filename}"`,
        'Content-Length': receipt.body.length,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(receipt.body);
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Unable to download receipt.', code: error.code });
    }
    return;
  }

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

  if (requestUrl.pathname === '/api/christmas-campaign/form-token' && req.method === 'GET') {
    try {
      assertAllowedOrigin(req);
      assertTokenRateLimit(clientIp(req));
      await sendJson(res, 200, issueFormToken());
    } catch (error) {
      if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      await sendJson(res, error.status || 500, {
        error: error.message || 'Unable to issue form token.',
        code: error.code || 'form_token_failed',
      });
    }
    return;
  }

  if (requestUrl.pathname === '/api/christmas-campaign/apply' && req.method === 'POST') {
    try {
      const contentType = String(req.headers['content-type'] || '');
      if (!contentType.toLowerCase().includes('application/json')) {
        await sendJson(res, 415, { error: 'Content-Type must be application/json.', code: 'unsupported_media_type' });
        return;
      }

      assertAllowedOrigin(req);
      const ip = clientIp(req);
      const body = await readJsonBody(req);

      assertFormToken(body.formToken);
      const emailHint = normalizeEmail(body.email);
      assertRateLimits({ ip, email: emailHint });

      const channelHint = String(body.channel || '').trim().toUpperCase();
      if (emailHint && (channelHint === 'ASIN' || channelHint === 'DTC')) {
        const existing = getRecentApplication(emailHint, channelHint);
        if (existing) {
          // Do not look like a fresh save — client must not open Calendly.
          await sendJson(res, 409, {
            ok: false,
            alreadyApplied: true,
            pageId: existing.pageId,
            url: existing.url,
            channel: channelHint,
            code: 'already_applied',
            error:
              'This work email already submitted an application. Please wait for our follow-up, or use a different work email.',
          });
          return;
        }
      }

      const result = await createChristmasCampaignApplication(body);
      if (!result?.pageId) {
        await sendJson(res, 502, {
          ok: false,
          code: 'notion_save_failed',
          error:
            "We couldn't save your application. Please try again — booking opens only after it is saved successfully.",
        });
        return;
      }
      rememberApplication(result.email || emailHint, result.channel, result);
      await sendJson(res, 201, {
        ok: true,
        pageId: result.pageId,
        url: result.url,
        channel: result.channel,
      });
    } catch (error) {
      console.error('[api/christmas-campaign/apply]', error && error.message, error && error.code);
      if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      const notionFailed =
        error.code === 'notion_api_error'
        || error.code === 'notion_token_missing'
        || error.status === 502;
      await sendJson(res, error.status || 500, {
        ok: false,
        error: notionFailed
          ? "We couldn't save your application right now. Please try again in a moment — booking opens only after it is saved successfully."
          : (error.message || "We couldn't save your application. Please try again."),
        code: error.code || 'christmas_campaign_apply_failed',
      });
    }
    return;
  }

  if (requestUrl.pathname === '/api/calendly/events') {
    if (req.method !== 'GET') {
      await sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }
    try {
      const date = requestUrl.searchParams.get('date') || '';
      const result = await listCalendlyEvents(date || undefined);
      await sendJson(res, 200, result);
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Calendly unavailable.' });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-session/resolve' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await resolvePilotSession(body);
      await sendJson(res, 200, result);
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Resolve failed.' });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-session/bind-account' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await bindPilotCustomerAccount({
        sn: body.sn,
        email: body.email,
        nickname: body.nickname,
      });
      await sendJson(res, 200, { success: true, data: result });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Bind account failed.' });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-session') {
    if (req.method !== 'GET') {
      await sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }
    try {
      const sn = requestUrl.searchParams.get('sn') || '';
      const session = await loadPilotSession(sn);
      await sendJson(res, 200, session);
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Session unavailable.' });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-plan/packages') {
    if (req.method !== 'GET') {
      await sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }
    try {
      const packages = await listPackages();
      await sendJson(res, 200, { packages });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Packages unavailable.' });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-plan/generate' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await savePilotPlan({
        sn: body.sn,
        packageId: body.package_id || body.packageId,
        pilotKpi: body.pilot_kpi || body.pilotKpi,
        pilotSegment: body.pilot_segment || body.pilotSegment,
        pilotDurationDays: body.pilot_duration_days ?? body.pilotDurationDays,
      });
      await sendJson(res, 200, result);
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Generate failed.', code: error.code });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pilot-plan/open-dashboard' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const sn = String(body.sn || '').trim();
      if (!sn) {
        await sendJson(res, 400, { error: 'sn is required' });
        return;
      }
      const live = await ensureSampleLive(sn);
      const quote = await loadPilotQuote(sn);
      const email = quote.customerEmail;
      if (!email) {
        await sendJson(res, 400, { error: 'Customer email is required for dashboard login.' });
        return;
      }
      const login = await createDashboardLoginLink({ email, next: body.next || '/' });
      await sendJson(res, 200, { live, url: login.url, expires_in: login.expires_in });
    } catch (error) {
      await sendJson(res, error.status || 500, { error: error.message || 'Dashboard link failed.' });
    }
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

  if (
    requestUrl.pathname === '/qualified-meeting-doc'
    || requestUrl.pathname === '/qualified-meeting-doc/'
    || requestUrl.pathname === '/qualified-meeting-doc.html'
  ) {
    await serveQualifiedMeetingDoc(res);
    return;
  }

  if (
    requestUrl.pathname === '/fit-meeting-sample'
    || requestUrl.pathname === '/fit-meeting-sample/'
    || requestUrl.pathname === '/fit-meeting-sample.html'
  ) {
    await serveFitMeetingSample(res);
    return;
  }

  if (
    requestUrl.pathname === '/fc-asin-plus-sample'
    || requestUrl.pathname === '/fc-asin-plus-sample/'
    || requestUrl.pathname === '/fc-asin-plus-sample.html'
  ) {
    await serveFcAsinPlusSample(res);
    return;
  }

  if (
    requestUrl.pathname === '/christmas-asin-campaign'
    || requestUrl.pathname === '/christmas-asin-campaign/'
    || requestUrl.pathname === '/christmas-asin-campaign.html'
  ) {
    await serveChristmasAsinCampaign(res);
    return;
  }

  if (
    requestUrl.pathname === '/christmas-dtc-campaign'
    || requestUrl.pathname === '/christmas-dtc-campaign/'
    || requestUrl.pathname === '/christmas-dtc-campaign.html'
  ) {
    await serveChristmasDtcCampaign(res);
    return;
  }

  if (
    requestUrl.pathname === '/pilot-plan/prep'
    || requestUrl.pathname === '/pilot-plan/prep/'
    || requestUrl.pathname === '/pilot-plan-prep.html'
  ) {
    await servePilotPlanPrep(res);
    return;
  }

  if (
    requestUrl.pathname === '/pilot-plan/meet'
    || requestUrl.pathname === '/pilot-plan/meet/'
  ) {
    await servePilotPlan(res);
    return;
  }

  if (
    requestUrl.pathname === '/pilot-plan'
    || requestUrl.pathname === '/pilot-plan/'
  ) {
    res.writeHead(302, { Location: '/pilot-plan/prep' });
    res.end();
    return;
  }

  if (requestUrl.pathname === '/pilot-plan.html') {
    await servePilotPlan(res);
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
    // Sample branding from magnet_brand_param (sn|id). Null fields → template defaults.
    const sn = requestUrl.searchParams.get('sn') || requestUrl.searchParams.get('id') || '';
    try {
      const proposal = await loadSampleProposalBySn(sn);
      await sendJson(res, 200, proposal);
    } catch (error) {
      console.error('[api/proposal] unexpected error:', error && error.message);
      const proposal = await loadSampleProposalBySn('');
      await sendJson(res, 200, proposal);
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
