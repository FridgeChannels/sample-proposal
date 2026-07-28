/**
 * Pilot commerce helpers: Supabase persistence for address/order/handoff + Stripe.
 * Used by sample-proposal server.js — amounts always recomputed server-side.
 */

const crypto = require('crypto');

const FINANCE_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const ORDER_STATUS_UNPAID = 0;
const ORDER_STATUS_PAID = 1;
const PAYMENT_STATUS_PAID = 1;
const DEFAULT_MIN_QUANTITY = 1000;
const SAMPLE_STATUS_LIVE = 3;

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

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

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

function makePaymentNo() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PAY-${stamp}-${rand}`;
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

async function loadPilotQuote(sn) {
  const magnetSn = String(sn || '').trim();
  if (!magnetSn) throw httpError('Magnet SN is required', 400);

  const discounts = await supabaseSelect('customer_package_discounts', {
    select: 'id,customer_id,magnet_sn,package_id,discount_ratio,status,expires_at,notes,updated_at,created_at',
    magnet_sn: `eq.${magnetSn}`,
    status: 'eq.active',
    order: 'updated_at.desc',
    limit: '5',
  });
  const discount = Array.isArray(discounts) ? discounts[0] : null;
  if (!discount) throw httpError('No active package discount is configured for this sample', 404, 'discount_missing');

  let packages;
  try {
    packages = await supabaseSelect('packages', {
      select: 'id,name,code,tier_rank,description,best_fit,year_1_price,year_2_price,currency,billing_unit,is_active,min_quantity',
      id: `eq.${discount.package_id}`,
      limit: '1',
    });
  } catch (error) {
    if (String(error.message || '').includes('min_quantity')) {
      packages = await supabaseSelect('packages', {
        select: 'id,name,code,tier_rank,description,best_fit,year_1_price,year_2_price,currency,billing_unit,is_active',
        id: `eq.${discount.package_id}`,
        limit: '1',
      });
    } else {
      throw error;
    }
  }
  const pkg = Array.isArray(packages) ? packages[0] : null;
  if (!pkg || pkg.is_active === false) throw httpError('Configured package is missing or inactive', 404, 'package_missing');

  const brandRows = await supabaseSelect('magnet_brand_param', {
    select: 'magnet_sn,brand_name,customer_id,magnet_id,status',
    magnet_sn: `eq.${magnetSn}`,
    limit: '1',
  });
  const brand = Array.isArray(brandRows) ? brandRows[0] : null;

  let includedServices = [];
  try {
    const matrix = await supabaseSelect('package_features', {
      select: 'included,notes,features(name,code,category,description,sort_order,is_active)',
      package_id: `eq.${pkg.id}`,
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
    includedServices = Array.from(byCategory.entries()).map(([title, items]) => ({ title, items }));
  } catch (error) {
    console.warn('[pilot-quote] package features lookup failed:', error.message);
  }

  const unitPrice = Number(pkg.year_1_price);
  const minQuantityRaw = Number.parseInt(String(pkg.min_quantity ?? ''), 10);
  const minQuantity = Number.isFinite(minQuantityRaw) && minQuantityRaw > 0 ? minQuantityRaw : DEFAULT_MIN_QUANTITY;
  const discountRatio = Number(discount.discount_ratio);
  const safeRatio = Number.isFinite(discountRatio) && discountRatio > 0 && discountRatio <= 1 ? discountRatio : 1;
  const percentOff = moneyRound((1 - safeRatio) * 100);
  const expiresAt = discount.expires_at || null;
  const expiryMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const notExpired = !Number.isFinite(expiryMs) || expiryMs > Date.now();

  return {
    sn: magnetSn,
    brandName: brand?.brand_name || null,
    customerId: brand?.customer_id ?? null,
    magnetId: brand?.magnet_id ?? null,
    package: {
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
    },
    includedServices,
    discount: {
      id: discount.id,
      ratio: safeRatio,
      percentOff,
      active: safeRatio < 1 && notExpired,
      expiresAt,
      notes: discount.notes || null,
    },
    tax: { collected: false, label: 'Not collected', amount: 0 },
    shipping: null,
  };
}

function computePilotTotals(quote, quantity) {
  const minQuantity = quote.package.minQuantity;
  const qty = Math.max(minQuantity, Number.parseInt(String(quantity), 10) || minQuantity);
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
  if (!approval || !approval.name || !approval.email) throw httpError('Approval details are required', 400);
  const addressId = Number(shippingAddressId);
  if (!Number.isFinite(addressId)) throw httpError('shippingAddressId is required', 400);

  const quote = await loadPilotQuote(sn);
  const customerId = Number(quote.customerId);
  if (!Number.isFinite(customerId)) throw httpError('Sample is missing customer_id', 409, 'customer_missing');

  const addressRows = await supabaseSelect('shipping_address', {
    select: '*',
    id: `eq.${addressId}`,
    customer_id: `eq.${customerId}`,
    limit: '1',
  });
  const address = Array.isArray(addressRows) ? addressRows[0] : null;
  if (!address) throw httpError('Shipping address not found for this customer', 404);

  const totals = computePilotTotals(quote, quantity);
  const orderNo = makeOrderNo();
  const remark = JSON.stringify({
    source: 'sample-proposal-pilot',
    magnet_sn: quote.sn,
    package_id: quote.package.id,
    package_code: quote.package.code,
    discount_id: quote.discount.id,
    discount_ratio: quote.discount.ratio,
    approval,
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
    shipping_address_id: addressId,
    receiver_name: `${address.first_name} ${address.last_name}`.trim(),
    receiver_phone: address.phone,
    currency: totals.currency,
    unit_price_cents: toCents(totals.unitPrice),
    // magnet_brand_param.magnet_id is not guaranteed to be magnet_config.id — omit FK.
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
    shippingAddressId: addressId,
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

async function createFinanceHandoff({ orderId, email, name, message, ccEmail, baseUrl }) {
  if (!/^\S+@\S+\.\S+$/.test(String(email || ''))) throw httpError('Enter a valid finance email.', 400);
  const invoice = await loadOrderInvoice(orderId);
  if (!invoice.approval) throw httpError('The order must be approved before sending to finance.', 409);
  if (Number(invoice.dbStatus) === ORDER_STATUS_PAID) throw httpError('This order is already paid.', 409);

  const token = crypto.randomBytes(24).toString('hex');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + FINANCE_LINK_TTL_MS).toISOString();
  const sn = invoice.magnetSn || '';
  const paymentUrl = sn
    ? `${baseUrl}/p/${encodeURIComponent(sn)}?finance=${token}#finance`
    : `${baseUrl}/post-meeting.html?finance=${token}#finance`;

  const row = await supabaseInsert('finance_handoff', {
    token,
    order_id: invoice.orderId,
    magnet_sn: sn || `order-${invoice.orderId}`,
    to_email: String(email).trim(),
    to_name: name || null,
    cc_email: ccEmail || null,
    message: message || null,
    status: 'sent',
    expires_at: expiresAt,
  });

  return {
    handoff: {
      id: row.id,
      token,
      email: row.to_email,
      name: row.to_name || '',
      status: row.status,
      paymentUrl,
      sentAt: createdAt,
      expiresAt,
      orderId: invoice.orderId,
      magnetSn: sn,
    },
    invoice,
  };
}

async function getFinanceHandoff(token) {
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

  const invoice = await loadOrderInvoice(handoff.order_id);
  const sn = invoice.magnetSn || handoff.magnet_sn || '';

  return {
    handoff: {
      token: handoff.token,
      email: handoff.to_email,
      name: handoff.to_name || '',
      status: handoff.status,
      // Absolute URL is filled by the HTTP layer using the request host.
      paymentUrl: '',
      sentAt: handoff.created_at,
      viewedAt: handoff.viewed_at || undefined,
      expiresAt: handoff.expires_at,
      orderId: handoff.order_id,
      magnetSn: sn,
      stripeCheckoutSessionId: handoff.stripe_checkout_session_id || null,
    },
    invoice,
  };
}

async function updateFinanceHandoffStatus(token, status) {
  const allowed = ['viewed', 'payment_pending', 'paid', 'revoked'];
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

async function createStripeCheckoutForOrder({ orderId, baseUrl, handoffToken }) {
  const secret = process.env.STRIPE_SECRET_KEY || '';
  if (!secret) throw httpError('Stripe is not configured (STRIPE_SECRET_KEY)', 503, 'stripe_unconfigured');

  const invoice = await loadOrderInvoice(orderId);
  if (Number(invoice.dbStatus) === ORDER_STATUS_PAID) throw httpError('This order is already paid.', 409);

  const sn = invoice.magnetSn || `order-${invoice.orderId}`;
  const successTemplate = process.env.STRIPE_SUCCESS_URL || `${baseUrl}/p/${encodeURIComponent(sn)}?checkout=success#order`;
  const cancelTemplate = process.env.STRIPE_CANCEL_URL || `${baseUrl}/p/${encodeURIComponent(sn)}?checkout=cancel#finance`;
  const successUrl = successTemplate.replaceAll('{sn}', encodeURIComponent(sn));
  const cancelUrl = cancelTemplate.replaceAll('{sn}', encodeURIComponent(sn));

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  params.set('client_reference_id', String(invoice.orderId));
  params.set('metadata[orderId]', String(invoice.orderId));
  params.set('metadata[orderNo]', invoice.orderNo);
  params.set('metadata[magnet_sn]', sn);
  params.set('metadata[quantity]', String(invoice.quantity));
  if (handoffToken) params.set('metadata[finance_token]', handoffToken);

  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', String(invoice.currency || 'USD').toLowerCase());
  params.set('line_items[0][price_data][unit_amount]', String(toCents(invoice.totalAmount)));
  params.set('line_items[0][price_data][product_data][name]', `${invoice.packageName}`);
  params.set(
    'line_items[0][price_data][product_data][description]',
    `${invoice.quantity} magnets · Tax: Not collected · Order ${invoice.orderNo}`,
  );

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw httpError(payload?.error?.message || `Stripe Checkout failed (${response.status})`, 502, 'stripe_error');
  }

  if (handoffToken) {
    await supabaseUpdate(
      'finance_handoff',
      { token: `eq.${handoffToken}` },
      {
        stripe_checkout_session_id: payload.id,
        status: 'payment_pending',
        updated_at: new Date().toISOString(),
      },
    );
  }

  return { id: payload.id, url: payload.url, invoice };
}

/** Legacy path: sn+quantity without a placed order yet — still server-priced. Prefer orderId. */
async function createStripeCheckoutFromQuote({ sn, quantity, baseUrl }) {
  const quote = await loadPilotQuote(sn);
  const totals = computePilotTotals(quote, quantity);
  const secret = process.env.STRIPE_SECRET_KEY || '';
  if (!secret) throw httpError('Stripe is not configured (STRIPE_SECRET_KEY)', 503, 'stripe_unconfigured');

  const successTemplate = process.env.STRIPE_SUCCESS_URL || `${baseUrl}/p/${encodeURIComponent(quote.sn)}?checkout=success#order`;
  const cancelTemplate = process.env.STRIPE_CANCEL_URL || `${baseUrl}/p/${encodeURIComponent(quote.sn)}?checkout=cancel#order`;
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', successTemplate.replaceAll('{sn}', encodeURIComponent(quote.sn)));
  params.set('cancel_url', cancelTemplate.replaceAll('{sn}', encodeURIComponent(quote.sn)));
  params.set('client_reference_id', quote.sn);
  params.set('metadata[magnet_sn]', quote.sn);
  params.set('metadata[quantity]', String(totals.quantity));
  params.set('metadata[package_id]', quote.package.id);
  params.set('metadata[total]', String(totals.total));
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', String(totals.currency || 'USD').toLowerCase());
  params.set('line_items[0][price_data][unit_amount]', String(toCents(totals.total)));
  params.set('line_items[0][price_data][product_data][name]', `${quote.package.name} · Pilot order`);
  params.set(
    'line_items[0][price_data][product_data][description]',
    `${totals.quantity} magnets @ $${totals.unitPrice.toFixed(2)} · Tax: Not collected`,
  );

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw httpError(payload?.error?.message || `Stripe Checkout failed (${response.status})`, 502, 'stripe_error');
  return { id: payload.id, url: payload.url, totals };
}

function stripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || '';
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!secret) throw httpError('STRIPE_WEBHOOK_SECRET is not configured', 503, 'stripe_webhook_unconfigured');
  if (!signatureHeader) throw httpError('Missing Stripe-Signature header', 400);

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(',')
      .map((piece) => piece.trim().split('='))
      .filter((pair) => pair.length === 2),
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) throw httpError('Invalid Stripe-Signature header', 400);

  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > 300) throw httpError('Stripe webhook timestamp too old', 400);

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(v1, 'hex');
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    throw httpError('Invalid Stripe webhook signature', 400);
  }
}

async function markOrderPaidFromStripeSession(session) {
  const orderId = Number(session?.metadata?.orderId || session?.client_reference_id);
  if (!Number.isFinite(orderId)) {
    console.warn('[stripe-webhook] missing orderId in session metadata', session?.id);
    return { ok: false, reason: 'missing_order_id' };
  }

  const invoice = await loadOrderInvoice(orderId);
  if (Number(invoice.dbStatus) === ORDER_STATUS_PAID) {
    return { ok: true, alreadyPaid: true, orderId };
  }

  const paymentTime = new Date().toISOString();
  await supabaseUpdate(
    'order',
    { id: `eq.${orderId}` },
    {
      status: ORDER_STATUS_PAID,
      payment_method: 'stripe_checkout',
      payment_time: paymentTime,
      updated_at: paymentTime,
    },
  );

  await supabaseInsert('payment', {
    order_id: orderId,
    payment_no: makePaymentNo(),
    transaction_no: session.payment_intent || session.id,
    payment_method: 'stripe_checkout',
    amount: invoice.totalAmount,
    currency: invoice.currency || 'USD',
    status: PAYMENT_STATUS_PAID,
    payment_time: paymentTime,
    callback_data: session,
  });

  const financeToken = session?.metadata?.finance_token;
  if (financeToken) {
    await supabaseUpdate(
      'finance_handoff',
      { token: `eq.${financeToken}` },
      { status: 'paid', stripe_checkout_session_id: session.id, updated_at: paymentTime },
    );
  } else {
    // Mark latest open handoffs for this order as paid.
    const open = await supabaseSelect('finance_handoff', {
      select: 'id,token,status',
      order_id: `eq.${orderId}`,
      status: 'in.(sent,viewed,payment_pending,preview)',
    });
    for (const row of Array.isArray(open) ? open : []) {
      await supabaseUpdate(
        'finance_handoff',
        { id: `eq.${row.id}` },
        { status: 'paid', stripe_checkout_session_id: session.id, updated_at: paymentTime },
      );
    }
  }

  // Mark discount used when present.
  if (invoice.discountId) {
    try {
      await supabaseUpdate(
        'customer_package_discounts',
        { id: `eq.${invoice.discountId}` },
        { status: 'used', used_at: paymentTime, updated_at: paymentTime },
      );
    } catch (error) {
      console.warn('[stripe-webhook] discount mark-used failed:', error.message);
    }
  }

  return { ok: true, orderId };
}

async function deliverFinanceEmail({ to, cc, financeName, approverName, invoice, paymentUrl, message }) {
  if (!process.env.RESEND_API_KEY) return { status: 'preview', providerId: null };
  const total = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.totalAmount);
  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FINANCE_FROM_EMAIL || 'FridgeChannel <orders@fridgechannel.com>',
      to: [to],
      cc: cc ? [cc] : undefined,
      subject: `Payment requested for FridgeChannel order ${invoice.orderNo}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#14281f"><p>Hi ${escapeHtml(financeName || 'Finance team')},</p><p><strong>${escapeHtml(approverName)}</strong> approved this FridgeChannel order and asked you to complete payment.</p><hr><p>Order: <strong>${escapeHtml(invoice.orderNo)}</strong><br>Package: <strong>${escapeHtml(invoice.packageName)}</strong><br>Quantity: <strong>${invoice.quantity.toLocaleString()} NFC magnets</strong></p><p style="font-size:30px">${total}</p>${message ? `<p>${escapeHtml(message)}</p>` : ''}<p><a href="${escapeHtml(paymentUrl)}" style="display:inline-block;padding:14px 20px;background:#0b3a28;color:white;text-decoration:none">Review &amp; Pay Invoice →</a></p><p style="color:#66736d;font-size:12px">This secure link expires in 14 days.</p></div>`,
    }),
  });
  if (!response.ok) throw httpError(`Email provider returned ${response.status}`, 502);
  const result = await response.json();
  return { status: 'sent', providerId: result.id || null };
}

module.exports = {
  FINANCE_LINK_TTL_MS,
  lookupSamplePhase,
  loadPilotQuote,
  computePilotTotals,
  savePilotAddress,
  createPilotOrder,
  loadOrderInvoice,
  createFinanceHandoff,
  getFinanceHandoff,
  updateFinanceHandoffStatus,
  createStripeCheckoutForOrder,
  createStripeCheckoutFromQuote,
  stripeWebhookSecret,
  verifyStripeSignature,
  markOrderPaidFromStripeSession,
  deliverFinanceEmail,
  moneyRound,
  toCents,
};
