/**
 * Pilot commerce helpers: Supabase persistence for address/order/handoff + Stripe Invoice.
 * Used by sample-proposal server.js — amounts always recomputed server-side.
 */

const crypto = require('crypto');

const FINANCE_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const ORDER_STATUS_UNPAID = 0;
const ORDER_STATUS_PAID = 1;
const DEFAULT_MIN_QUANTITY = 1000;
/** Pilot ships 1,000 magnets unless the package requires more. */
const DEFAULT_PILOT_QUANTITY = 1000;
const SAMPLE_STATUS_LIVE = 3;
const DEFAULT_PACKAGE_CODE = 'PKG-PPM';
const STRIPE_INVOICE_DAYS_UNTIL_DUE = 7;

const COUNTRY_TO_ISO = {
  'united states': 'US',
  usa: 'US',
  us: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  canada: 'CA',
  australia: 'AU',
  china: 'CN',
  singapore: 'SG',
  japan: 'JP',
};

function supabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_API_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  return { supabaseUrl, apiKey };
}

function moneyRound(value) {
  return Math.round(Number(value) * 100) / 100;
}

function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

function httpError(message, status = 500, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

/**
 * Errors raised before the request reaches PostgREST. The dominant case is a
 * keep-alive socket that Supabase closed while idle but which is still in
 * Node's pool, surfaced as the opaque "fetch failed". Retrying these is safe
 * for every method because the server never saw the request.
 */
const UNSENT_REQUEST_CODES = new Set([
  'UND_ERR_SOCKET',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
]);
/** Ambiguous: the request may have been applied, so only replay it when idempotent. */
const AMBIGUOUS_REQUEST_CODES = new Set(['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT']);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'PATCH', 'PUT', 'DELETE']);
const MAX_FETCH_ATTEMPTS = 3;

/** `fetch` buries the real reason in a cause chain; dig it out for logs and errors. */
function networkErrorCode(error) {
  let current = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current.code) return current.code;
    current = current.cause;
  }
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {boolean} replayable Whether repeating the call is side-effect free,
 *   either because the method is idempotent or because the request carries an
 *   idempotency key.
 */
async function fetchWithRetry(url, init, { label, replayable, errorCode }) {
  const method = init.method || 'GET';
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      const code = networkErrorCode(error);
      const retryable = UNSENT_REQUEST_CODES.has(code)
        || (AMBIGUOUS_REQUEST_CODES.has(code) && (replayable || IDEMPOTENT_METHODS.has(method)));

      if (!retryable || attempt >= MAX_FETCH_ATTEMPTS) {
        throw httpError(
          `${label} unreachable after ${attempt} attempt(s): ${code || error.message}`,
          502,
          errorCode,
        );
      }

      console.warn(`[${errorCode}] ${label} ${code}, retrying (${attempt}/${MAX_FETCH_ATTEMPTS - 1})`);
      await sleep(100 * attempt);
    }
  }
}

async function supabaseRequest(method, table, { query = {}, body, prefer } = {}) {
  const { supabaseUrl, apiKey } = supabaseConfig();
  if (!supabaseUrl || !apiKey) throw httpError('Supabase is not configured', 503, 'supabase_unconfigured');

  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetchWithRetry(
    url,
    {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    { label: `Supabase ${method} ${table}`, replayable: false, errorCode: 'supabase_unreachable' },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw httpError(`Supabase ${method} ${table} failed (${response.status}): ${detail.slice(0, 300)}`, response.status >= 400 && response.status < 600 ? response.status : 502);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function supabaseSelect(table, query = {}) {
  return supabaseRequest('GET', table, { query });
}

async function supabaseInsert(table, row, { prefer = 'return=representation' } = {}) {
  const rows = await supabaseRequest('POST', table, { body: row, prefer });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function supabaseUpdate(table, query, patch, { prefer = 'return=representation' } = {}) {
  const rows = await supabaseRequest('PATCH', table, { query, body: patch, prefer });
  return Array.isArray(rows) ? rows[0] : rows;
}

function countryToIso(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'US';
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  return COUNTRY_TO_ISO[raw.toLowerCase()] || 'US';
}

function splitRecipientName(recipientName) {
  const parts = String(recipientName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: 'Recipient', lastName: 'Unknown' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function formatAddress(address) {
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

function makeOrderNo() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

function stripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || '';
}

async function stripeRequest(method, apiPath, params = {}) {
  const secret = stripeSecretKey();
  if (!secret) throw httpError('Stripe is not configured (STRIPE_SECRET_KEY)', 503, 'stripe_unconfigured');

  const headers = { Authorization: `Bearer ${secret}` };
  let body;
  if (method !== 'GET' && Object.keys(params).length) {
    const encoded = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) encoded.set(key, String(value));
    });
    body = encoded.toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  // Scoped to this call, so a network retry below is deduplicated by Stripe
  // rather than creating a second invoice.
  if (method !== 'GET') headers['Idempotency-Key'] = crypto.randomUUID();

  const url = `https://api.stripe.com/v1${apiPath}${method === 'GET' && Object.keys(params).length ? `?${new URLSearchParams(params)}` : ''}`;
  const response = await fetchWithRetry(
    url,
    { method, headers, body },
    { label: `Stripe ${method} ${apiPath}`, replayable: true, errorCode: 'stripe_unreachable' },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw httpError(payload?.error?.message || `Stripe ${method} ${apiPath} failed (${response.status})`, 502, 'stripe_error');
  }
  return payload;
}

async function lookupSamplePhase(sn) {
  const magnetSn = String(sn || '').trim();
  if (!magnetSn) return { phase: 'sample', status: null, magnetSn: '', reason: 'missing_sn' };

  try {
    const rows = await supabaseSelect('magnet_brand_param', {
      select: 'magnet_sn,status,sample,brand_name,customer_id,magnet_id',
      magnet_sn: `eq.${magnetSn}`,
      limit: '1',
    });
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return { phase: 'sample', status: null, magnetSn, reason: 'not_found' };
    const status = Number.parseInt(String(row.status ?? ''), 10);
    return {
      phase: status === SAMPLE_STATUS_LIVE ? 'live' : 'sample',
      status: Number.isFinite(status) ? status : null,
      magnetSn,
      brandName: row.brand_name || null,
      customerId: row.customer_id ?? null,
      magnetId: row.magnet_id ?? null,
      reason: 'ok',
    };
  } catch (error) {
    if (error.code === 'supabase_unconfigured') {
      return { phase: 'sample', status: null, magnetSn, reason: 'supabase_unconfigured' };
    }
    console.warn(`[sample-phase] lookup failed for sn=${magnetSn}:`, error.message);
    return { phase: 'sample', status: null, magnetSn, reason: 'lookup_error' };
  }
}

async function loadPackageRow(query) {
  let packages;
  try {
    packages = await supabaseSelect('packages', {
      select: 'id,name,code,tier_rank,description,best_fit,year_1_price,year_2_price,currency,billing_unit,is_active,min_quantity',
      ...query,
      limit: '1',
    });
  } catch (error) {
    if (String(error.message || '').includes('min_quantity')) {
      packages = await supabaseSelect('packages', {
        select: 'id,name,code,tier_rank,description,best_fit,year_1_price,year_2_price,currency,billing_unit,is_active',
        ...query,
        limit: '1',
      });
    } else {
      throw error;
    }
  }
  return Array.isArray(packages) ? packages[0] : null;
}

async function loadPackageFeatures(packageId) {
  try {
    const matrix = await supabaseSelect('package_features', {
      select: 'included,notes,features(name,code,category,description,sort_order,is_active)',
      package_id: `eq.${packageId}`,
      included: 'eq.true',
    });
    const byCategory = new Map();
    for (const row of Array.isArray(matrix) ? matrix : []) {
      const feature = row.features;
      if (!feature || feature.is_active === false) continue;
      const category = feature.category || 'Included';
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category).push(feature.name);
    }
    return Array.from(byCategory.entries()).map(([title, items]) => ({ title, items }));
  } catch (error) {
    console.warn('[pilot-quote] package features lookup failed:', error.message);
    return [];
  }
}

function mapPackage(pkg) {
  const unitPrice = Number(pkg.year_1_price);
  const minQuantityRaw = Number.parseInt(String(pkg.min_quantity ?? ''), 10);
  const minQuantity = Number.isFinite(minQuantityRaw) && minQuantityRaw > 0 ? minQuantityRaw : DEFAULT_MIN_QUANTITY;
  return {
    id: pkg.id,
    code: pkg.code,
    name: pkg.name,
    description: pkg.description || '',
    bestFit: pkg.best_fit || '',
    year1Price: unitPrice,
    year2Price: Number(pkg.year_2_price),
    currency: pkg.currency || 'USD',
    billingUnit: pkg.billing_unit || 'Per Card / Year',
    minQuantity,
  };
}

async function loadPilotQuote(sn) {
  const magnetSn = String(sn || '').trim();
  if (!magnetSn) throw httpError('Magnet SN is required', 400);

  const brandRows = await supabaseSelect('magnet_brand_param', {
    select: 'magnet_sn,brand_name,customer_id,magnet_id,status',
    magnet_sn: `eq.${magnetSn}`,
    limit: '1',
  });
  const brand = Array.isArray(brandRows) ? brandRows[0] : null;
  if (!brand) throw httpError('Magnet SN not found', 404, 'sn_not_found');

  let customerCreatedAt = null;
  let customerEmail = null;
  const customerId = brand.customer_id ?? null;
  if (customerId != null) {
    const customers = await supabaseSelect('customer', {
      select: 'id,created_at,email',
      id: `eq.${customerId}`,
      limit: '1',
    });
    const customer = Array.isArray(customers) ? customers[0] : null;
    customerCreatedAt = customer?.created_at || null;
    customerEmail = customer?.email || null;
  }

  const discounts = await supabaseSelect('customer_package_discounts', {
    select: 'id,customer_id,magnet_sn,package_id,discount_ratio,status,expires_at,notes,updated_at,created_at',
    magnet_sn: `eq.${magnetSn}`,
    status: 'eq.active',
    order: 'updated_at.desc',
    limit: '5',
  });
  const discount = Array.isArray(discounts) ? discounts[0] : null;

  let pkg;
  if (discount?.package_id) {
    pkg = await loadPackageRow({ id: `eq.${discount.package_id}` });
  } else {
    pkg = await loadPackageRow({ code: `eq.${DEFAULT_PACKAGE_CODE}` });
  }
  if (!pkg || pkg.is_active === false) {
    throw httpError('Configured package is missing or inactive', 404, 'package_missing');
  }

  const includedServices = await loadPackageFeatures(pkg.id);
  const packageInfo = mapPackage(pkg);

  let discountInfo;
  if (discount) {
    const discountRatio = Number(discount.discount_ratio);
    const safeRatio = Number.isFinite(discountRatio) && discountRatio > 0 && discountRatio <= 1 ? discountRatio : 1;
    const percentOff = moneyRound((1 - safeRatio) * 100);
    const expiresAt = discount.expires_at || null;
    const expiryMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
    const notExpired = !Number.isFinite(expiryMs) || expiryMs > Date.now();
    discountInfo = {
      id: discount.id,
      ratio: safeRatio,
      percentOff,
      active: safeRatio < 1 && notExpired,
      expiresAt,
      notes: discount.notes || null,
    };
  } else {
    discountInfo = {
      id: null,
      ratio: 1,
      percentOff: 0,
      active: false,
      expiresAt: null,
      notes: null,
    };
  }

  return {
    sn: magnetSn,
    brandName: brand.brand_name || null,
    customerId,
    customerCreatedAt,
    customerEmail,
    magnetId: brand.magnet_id ?? null,
    package: packageInfo,
    includedServices,
    discount: discountInfo,
    tax: { collected: false, label: 'Not collected', amount: 0 },
    shipping: null,
  };
}

function computePilotTotals(quote, quantity) {
  const minQuantity = quote.package.minQuantity;
  const qty = Math.max(minQuantity, Number.parseInt(String(quantity), 10) || DEFAULT_PILOT_QUANTITY);
  const unitPrice = quote.package.year1Price;
  const magnetsAmount = moneyRound(qty * unitPrice);
  const discountActive = Boolean(quote.discount?.active);
  const discountAmount = discountActive ? moneyRound(-(magnetsAmount * (1 - quote.discount.ratio))) : 0;
  const taxAmount = 0;
  const total = moneyRound(magnetsAmount + discountAmount + taxAmount);
  return {
    quantity: qty,
    unitPrice,
    magnetsAmount,
    discountAmount,
    taxAmount,
    total,
    currency: quote.package.currency || 'USD',
  };
}

async function savePilotAddress({ sn, address }) {
  const quote = await loadPilotQuote(sn);
  const customerId = Number(quote.customerId);
  if (!Number.isFinite(customerId)) throw httpError('Sample is missing customer_id; cannot save address', 409, 'customer_missing');

  const phone = String(address.phone || '').trim();
  if (!phone) throw httpError('Phone is required', 400);
  if (!String(address.recipientName || '').trim()) throw httpError('Recipient name is required', 400);
  if (!String(address.addressLine1 || '').trim()) throw httpError('Street address is required', 400);
  if (!String(address.city || '').trim()) throw httpError('City is required', 400);
  if (!String(address.state || '').trim()) throw httpError('State is required', 400);
  if (!String(address.postalCode || '').trim()) throw httpError('ZIP code is required', 400);

  const { firstName, lastName } = splitRecipientName(address.recipientName);
  const country = countryToIso(address.country);
  const formatted = formatAddress({ ...address, country });

  const row = await supabaseInsert('shipping_address', {
    customer_id: customerId,
    first_name: firstName,
    last_name: lastName,
    phone,
    street: String(address.addressLine1).trim(),
    address_line_2: String(address.addressLine2 || '').trim() || null,
    city: String(address.city).trim(),
    state: String(address.state).trim(),
    zipcode: String(address.postalCode).trim(),
    country,
    formatted_address: formatted,
    email: String(address.email || '').trim() || null,
    is_validated: false,
    is_default: false,
  });

  return {
    id: row.id,
    recipientName: `${firstName} ${lastName}`.replace(/ -$/, '').trim(),
    companyName: address.companyName || '',
    addressLine1: row.street,
    addressLine2: row.address_line_2 || '',
    city: row.city,
    state: row.state,
    postalCode: row.zipcode,
    country: row.country,
    phone: row.phone,
    email: row.email || '',
    formattedAddress: row.formatted_address,
  };
}

async function createPilotOrder({ sn, quantity, shippingAddressId, approval }) {
  const addressId = shippingAddressId != null ? Number(shippingAddressId) : null;

  const quote = await loadPilotQuote(sn);
  const customerId = Number(quote.customerId);
  if (!Number.isFinite(customerId)) throw httpError('Sample is missing customer_id', 409, 'customer_missing');

  let address = null;
  if (Number.isFinite(addressId)) {
    const addressRows = await supabaseSelect('shipping_address', {
      select: '*',
      id: `eq.${addressId}`,
      customer_id: `eq.${customerId}`,
      limit: '1',
    });
    address = Array.isArray(addressRows) ? addressRows[0] : null;
    if (!address) throw httpError('Shipping address not found for this customer', 404);
  }

  const totals = computePilotTotals(quote, quantity);
  const orderNo = makeOrderNo();
  const remark = JSON.stringify({
    source: 'sample-proposal-pilot',
    magnet_sn: quote.sn,
    package_id: quote.package.id,
    package_code: quote.package.code,
    discount_id: quote.discount.id,
    discount_ratio: quote.discount.ratio,
    approval: approval || null,
  });

  const order = await supabaseInsert('order', {
    order_no: orderNo,
    customer_id: customerId,
    quantity: totals.quantity,
    amount: totals.magnetsAmount,
    shipping_fee: 0,
    tax_fee: 0,
    total_amount: totals.total,
    status: ORDER_STATUS_UNPAID,
    payment_method: null,
    shipping_address_id: Number.isFinite(addressId) ? addressId : null,
    receiver_name: address ? `${address.first_name} ${address.last_name}`.trim() : null,
    receiver_phone: address?.phone || null,
    currency: totals.currency,
    unit_price_cents: toCents(totals.unitPrice),
    magnet_config_id: null,
    remark,
  });

  await supabaseInsert('order_item', {
    order_id: order.id,
    magnet_id: null,
    item_name: `${quote.package.name} · NFC magnets`,
    item_type: 'product',
    unit_price: totals.unitPrice,
    quantity: totals.quantity,
    subtotal: totals.magnetsAmount,
  });

  if (totals.discountAmount < 0) {
    await supabaseInsert('order_item', {
      order_id: order.id,
      magnet_id: null,
      item_name: `Pilot discount · ${Math.round(quote.discount.percentOff)}% OFF`,
      item_type: 'discount',
      unit_price: totals.discountAmount,
      quantity: 1,
      subtotal: totals.discountAmount,
    });
  }

  return {
    orderId: order.id,
    orderNo: order.order_no,
    totals,
    quote,
    shippingAddressId: Number.isFinite(addressId) ? addressId : null,
  };
}

async function updateOrderShipping({ orderId, shippingAddressId }) {
  const id = Number(orderId);
  const addressId = Number(shippingAddressId);
  if (!Number.isFinite(id)) throw httpError('orderId is required', 400);
  if (!Number.isFinite(addressId)) throw httpError('shippingAddressId is required', 400);

  const orders = await supabaseSelect('order', { select: 'id,customer_id,status', id: `eq.${id}`, limit: '1' });
  const order = Array.isArray(orders) ? orders[0] : null;
  if (!order) throw httpError('Order not found', 404);
  if (Number(order.status) === ORDER_STATUS_PAID) throw httpError('This order is already paid.', 409);

  const addressRows = await supabaseSelect('shipping_address', {
    select: '*',
    id: `eq.${addressId}`,
    customer_id: `eq.${order.customer_id}`,
    limit: '1',
  });
  const address = Array.isArray(addressRows) ? addressRows[0] : null;
  if (!address) throw httpError('Shipping address not found for this customer', 404);

  await supabaseUpdate(
    'order',
    { id: `eq.${id}` },
    {
      shipping_address_id: addressId,
      receiver_name: `${address.first_name} ${address.last_name}`.trim(),
      receiver_phone: address.phone,
      updated_at: new Date().toISOString(),
    },
  );

  return { orderId: id, shippingAddressId: addressId };
}

async function createFinanceHandoff({ orderId, magnetSn, toEmail, toName }) {
  const email = String(toEmail || '').trim();
  if (!email || !email.includes('@')) throw httpError('A valid finance email is required', 400);

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + FINANCE_LINK_TTL_MS).toISOString();
  const row = await supabaseInsert('finance_handoff', {
    token,
    order_id: orderId,
    magnet_sn: magnetSn,
    to_email: email,
    to_name: toName || null,
    status: 'sent',
    expires_at: expiresAt,
  });

  return {
    token: row.token,
    status: row.status,
    sentAt: row.created_at,
    expiresAt: row.expires_at,
    orderId,
    magnetSn,
  };
}

async function loadOrderInvoice(orderId) {
  const id = Number(orderId);
  if (!Number.isFinite(id)) throw httpError('orderId is required', 400);

  const orders = await supabaseSelect('order', { select: '*', id: `eq.${id}`, limit: '1' });
  const order = Array.isArray(orders) ? orders[0] : null;
  if (!order) throw httpError('Order not found', 404);

  const items = await supabaseSelect('order_item', {
    select: '*',
    order_id: `eq.${id}`,
    order: 'id.asc',
  });

  let address = null;
  if (order.shipping_address_id) {
    const rows = await supabaseSelect('shipping_address', {
      select: '*',
      id: `eq.${order.shipping_address_id}`,
      limit: '1',
    });
    address = Array.isArray(rows) ? rows[0] : null;
  }

  let remark = {};
  try {
    remark = order.remark ? JSON.parse(order.remark) : {};
  } catch {
    remark = {};
  }

  const uiStatus =
    Number(order.status) === ORDER_STATUS_PAID
      ? 'paid'
      : remark.approval
        ? 'approved'
        : 'ready_for_approval';

  return {
    orderId: order.id,
    orderNo: order.order_no,
    invoiceNumber: `INV-${order.order_no}`,
    magnetSn: remark.magnet_sn || null,
    packageCode: remark.package_code || null,
    packageName: (Array.isArray(items) ? items.find((i) => i.item_type === 'product') : null)?.item_name || 'Pilot package',
    quantity: order.quantity,
    unitPrice: (order.unit_price_cents || 0) / 100,
    amount: Number(order.amount),
    shippingFee: Number(order.shipping_fee || 0),
    taxFee: Number(order.tax_fee || 0),
    totalAmount: Number(order.total_amount),
    currency: order.currency || 'USD',
    dbStatus: order.status,
    uiStatus,
    paymentMethod: order.payment_method,
    paymentTime: order.payment_time,
    approval: remark.approval || null,
    discountId: remark.discount_id || null,
    items: (Array.isArray(items) ? items : []).map((item) => ({
      id: item.id,
      name: item.item_name,
      type: item.item_type,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    })),
    shippingAddress: address
      ? {
          id: address.id,
          recipientName: `${address.first_name} ${address.last_name}`.trim(),
          phone: address.phone,
          addressLine1: address.street,
          addressLine2: address.address_line_2 || '',
          city: address.city,
          state: address.state,
          postalCode: address.zipcode,
          country: address.country,
          email: address.email || '',
          formattedAddress: address.formatted_address,
        }
      : null,
  };
}

async function getFinanceHandoffRow(token) {
  const rows = await supabaseSelect('finance_handoff', {
    select: '*',
    token: `eq.${token}`,
    limit: '1',
  });
  const handoff = Array.isArray(rows) ? rows[0] : null;
  if (!handoff) throw httpError('Finance link not found or no longer available.', 404);
  if (Date.now() > Date.parse(handoff.expires_at)) {
    await supabaseUpdate('finance_handoff', { token: `eq.${token}` }, { status: 'expired', updated_at: new Date().toISOString() });
    throw httpError('This finance link has expired.', 410);
  }
  return handoff;
}

async function getFinanceHandoff(token) {
  const handoff = await getFinanceHandoffRow(token);
  const invoice = await loadOrderInvoice(handoff.order_id);
  const sn = invoice.magnetSn || handoff.magnet_sn || '';

  return {
    handoff: {
      token: handoff.token,
      status: handoff.status,
      paymentUrl: '',
      sentAt: handoff.created_at,
      viewedAt: handoff.viewed_at || undefined,
      expiresAt: handoff.expires_at,
      orderId: handoff.order_id,
      magnetSn: sn,
      stripeCheckoutSessionId: handoff.stripe_checkout_session_id || null,
      stripeInvoiceId: handoff.stripe_invoice_id || handoff.stripe_checkout_session_id || null,
      stripeCustomerId: handoff.stripe_customer_id || null,
      hostedInvoiceUrl: handoff.hosted_invoice_url || null,
    },
    invoice,
  };
}

async function updateFinanceHandoffStatus(token, status) {
  const allowed = ['viewed', 'payment_pending', 'paid', 'revoked', 'failed'];
  if (!allowed.includes(status)) throw httpError('Invalid handoff status.', 400);

  const current = await getFinanceHandoff(token);
  const terminalOrPending = ['payment_pending', 'paid', 'revoked'];
  let nextStatus = status;
  if (status === 'viewed' && terminalOrPending.includes(current.handoff.status)) {
    nextStatus = current.handoff.status;
  }

  const patch = { status: nextStatus, updated_at: new Date().toISOString() };
  if (status === 'viewed' && !current.handoff.viewedAt) patch.viewed_at = new Date().toISOString();

  await supabaseUpdate('finance_handoff', { token: `eq.${token}` }, patch);
  return getFinanceHandoff(token);
}

async function findOrCreateStripeCustomer({ email, name, metadata = {} }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail.includes('@')) throw httpError('A valid payment email is required', 400);

  const search = await stripeRequest('GET', '/customers/search', {
    query: `email:'${normalizedEmail.replace(/'/g, "\\'")}'`,
    limit: '1',
  });
  const existing = Array.isArray(search.data) ? search.data[0] : null;
  if (existing?.id) return existing;

  const params = {
    email: normalizedEmail,
    name: name || undefined,
  };
  Object.entries(metadata).forEach(([key, value]) => {
    if (value != null && value !== '') params[`metadata[${key}]`] = String(value);
  });

  return stripeRequest('POST', '/customers', params);
}

async function retrieveStripeInvoice(invoiceId) {
  return stripeRequest('GET', `/invoices/${invoiceId}`, {});
}

const STRIPE_INVOICE_COLUMNS = ['stripe_customer_id', 'stripe_invoice_id', 'hosted_invoice_url'];

/**
 * Patches finance_handoff, retrying without the Stripe Invoice columns when
 * sql/2026-07-29-finance-handoff-stripe-invoice.sql has not been applied yet.
 * The invoice id then falls back to the legacy checkout-session column so the
 * external webhook service can still resolve the order.
 */
async function updateFinanceHandoff(query, patch) {
  try {
    await supabaseUpdate('finance_handoff', query, patch);
    return;
  } catch (error) {
    const message = String(error.message || '');
    if (!STRIPE_INVOICE_COLUMNS.some((column) => message.includes(column))) throw error;
  }

  const fallback = { ...patch };
  for (const column of STRIPE_INVOICE_COLUMNS) delete fallback[column];
  if (patch.stripe_invoice_id) fallback.stripe_checkout_session_id = patch.stripe_invoice_id;
  await supabaseUpdate('finance_handoff', query, fallback);
}

async function createStripeInvoiceForOrder({ orderId, paymentEmail, handoffToken, payerName }) {
  const invoice = await loadOrderInvoice(orderId);
  if (Number(invoice.dbStatus) === ORDER_STATUS_PAID) throw httpError('This order is already paid.', 409);
  if (!invoice.shippingAddress) throw httpError('Shipping address is required before invoicing.', 409, 'shipping_missing');

  let handoffRow = null;
  if (handoffToken) {
    handoffRow = await getFinanceHandoffRow(handoffToken);
    if (Number(handoffRow.order_id) !== Number(orderId)) {
      throw httpError('Finance token does not match this order.', 403);
    }
    if (handoffRow.stripe_invoice_id || handoffRow.stripe_checkout_session_id) {
      const existingId = handoffRow.stripe_invoice_id || handoffRow.stripe_checkout_session_id;
      const existing = await retrieveStripeInvoice(existingId);
      if (existing.status === 'paid') throw httpError('This order is already paid.', 409);
      if (existing.hosted_invoice_url) {
        return {
          id: existing.id,
          url: existing.hosted_invoice_url,
          hostedInvoiceUrl: existing.hosted_invoice_url,
          invoice,
          reused: true,
        };
      }
    }
  }

  const customer = await findOrCreateStripeCustomer({
    email: paymentEmail,
    name: payerName || invoice.shippingAddress.recipientName,
    metadata: {
      orderId: String(invoice.orderId),
      magnet_sn: invoice.magnetSn || '',
    },
  });

  const draftParams = {
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: String(STRIPE_INVOICE_DAYS_UNTIL_DUE),
    pending_invoice_items_behavior: 'exclude',
    currency: String(invoice.currency || 'USD').toLowerCase(),
    'metadata[orderId]': String(invoice.orderId),
    'metadata[orderNo]': invoice.orderNo,
    'metadata[magnet_sn]': invoice.magnetSn || '',
  };
  if (handoffToken) draftParams['metadata[finance_token]'] = handoffToken;

  const draftInvoice = await stripeRequest('POST', '/invoices', draftParams);

  for (const item of invoice.items) {
    const amountCents = toCents(item.subtotal);
    if (!amountCents) continue;
    await stripeRequest('POST', '/invoiceitems', {
      customer: customer.id,
      invoice: draftInvoice.id,
      amount: String(amountCents),
      currency: String(invoice.currency || 'USD').toLowerCase(),
      description: item.name,
    });
  }

  const finalized = await stripeRequest('POST', `/invoices/${draftInvoice.id}/finalize`, {});
  const expectedTotal = toCents(invoice.totalAmount);
  if (finalized.total !== expectedTotal) {
    try {
      await stripeRequest('POST', `/invoices/${draftInvoice.id}/void`, {});
    } catch (voidError) {
      console.warn('[stripe-invoice] void after total mismatch failed:', voidError.message);
    }
    throw httpError('Invoice total mismatch — payment blocked for security.', 502, 'invoice_total_mismatch');
  }

  const sent = await stripeRequest('POST', `/invoices/${draftInvoice.id}/send`, {});

  const patch = {
    stripe_customer_id: customer.id,
    stripe_invoice_id: sent.id,
    hosted_invoice_url: sent.hosted_invoice_url,
    status: 'payment_pending',
    to_email: paymentEmail,
    updated_at: new Date().toISOString(),
  };

  if (handoffToken) {
    await updateFinanceHandoff({ token: `eq.${handoffToken}` }, patch);
  } else {
    const open = await supabaseSelect('finance_handoff', {
      select: 'id,token',
      order_id: `eq.${orderId}`,
      status: 'in.(sent,viewed,payment_pending,preview)',
      order: 'created_at.desc',
      limit: '1',
    });
    const row = Array.isArray(open) ? open[0] : null;
    if (row) await updateFinanceHandoff({ id: `eq.${row.id}` }, patch);
  }

  return {
    id: sent.id,
    url: sent.hosted_invoice_url,
    hostedInvoiceUrl: sent.hosted_invoice_url,
    invoice,
    reused: false,
  };
}

module.exports = {
  FINANCE_LINK_TTL_MS,
  lookupSamplePhase,
  loadPilotQuote,
  computePilotTotals,
  savePilotAddress,
  createPilotOrder,
  updateOrderShipping,
  createFinanceHandoff,
  loadOrderInvoice,
  getFinanceHandoff,
  updateFinanceHandoffStatus,
  createStripeInvoiceForOrder,
  moneyRound,
  toCents,
};
