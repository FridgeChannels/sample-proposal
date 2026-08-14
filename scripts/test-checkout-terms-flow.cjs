#!/usr/bin/env node
/**
 * Integration test: customer_billing + order_terms_acceptance checkout flow.
 * Run: node scripts/test-checkout-terms-flow.mjs
 * Requires: sample-proposal server on PORT (default 4174), Supabase tables migrated.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(ENV_PATH);

const PORT = Number(process.env.PORT || 4174);
const BASE = `http://127.0.0.1:${PORT}`;
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY || '';

const TEST_SN = process.env.TEST_MAGNET_SN || 'G5QD0W25PM';

const billingFixture = {
  companyName: 'Terms Test Co',
  address: '123 Legal Ave, Wilmington, DE 19801',
  contactName: 'Jane Signatory',
  jobTitle: 'VP Finance',
  email: `terms-test+${Date.now()}@example.com`,
  poNumber: '',
};

const shippingFixture = {
  firstName: 'Jane',
  lastName: 'Signatory',
  recipientName: 'Jane Signatory',
  companyName: billingFixture.companyName,
  addressLine1: '456 Ship St',
  addressLine2: '',
  city: 'Wilmington',
  state: 'DE',
  postalCode: '19801',
  country: 'United States',
  phone: '3025550100',
  email: billingFixture.email,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function supabaseGet(table, query) {
  const params = new URLSearchParams({ ...query, select: query.select || '*' });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    const err = new Error(`Supabase GET ${table} failed (${response.status}): ${text.slice(0, 200)}`);
    err.status = response.status;
    throw err;
  }
  return text ? JSON.parse(text) : [];
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  return { ok: response.ok, status: response.status, data };
}

async function ensureTablesExist() {
  for (const table of ['customer_billing', 'order_terms_acceptance']) {
    try {
      await supabaseGet(table, { select: 'id', limit: '1' });
      console.log(`✓ table ${table} exists`);
    } catch (error) {
      if (error.status === 404 || String(error.message).includes('404')) {
        throw new Error(
          `Missing table public.${table}. Run in Supabase SQL editor:\n`
          + `  docs/sql/2026-08-14-customer-billing.sql\n`
          + `  docs/sql/2026-08-14-order-terms-acceptance.sql\n`
          + `Or: supabase/migrations/20260814154500_customer_billing_and_terms_acceptance.sql`,
        );
      }
      throw error;
    }
  }
}

async function main() {
  console.log('=== Checkout terms + billing integration test ===\n');
  assert(SUPABASE_URL && SUPABASE_KEY, 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env');

  await ensureTablesExist();

  const health = await fetch(`${BASE}/post-meeting.html`);
  assert(health.ok, `Server not reachable at ${BASE} (is npm run start running?)`);

  console.log(`Using magnet SN: ${TEST_SN}`);

  const quoteRes = await apiJson(`${BASE}/api/pilot-quote?sn=${encodeURIComponent(TEST_SN)}`);
  assert(quoteRes.ok, `pilot-quote failed: ${JSON.stringify(quoteRes.data)}`);
  const customerId = quoteRes.data?.quote?.customerId;
  assert(customerId, 'Quote missing customerId');

  const handoffRes = await apiJson(`${BASE}/api/finance-handoffs`, {
    method: 'POST',
    body: JSON.stringify({ sn: TEST_SN, shippingMethod: 'air' }),
  });
  assert(handoffRes.ok, `finance-handoffs failed: ${JSON.stringify(handoffRes.data)}`);
  const orderId = handoffRes.data?.orderId;
  assert(orderId, 'Missing orderId from finance handoff');
  console.log(`✓ Created unpaid order #${orderId}`);

  const addressRes = await apiJson(`${BASE}/api/pilot-orders/address`, {
    method: 'POST',
    body: JSON.stringify({ sn: TEST_SN, address: shippingFixture }),
  });
  assert(addressRes.ok, `address save failed: ${JSON.stringify(addressRes.data)}`);
  const shippingAddressId = addressRes.data?.address?.id;
  assert(shippingAddressId, 'Missing shipping address id');

  const shippingLinkRes = await apiJson(`${BASE}/api/pilot-orders/shipping`, {
    method: 'PATCH',
    body: JSON.stringify({ orderId, shippingAddressId, billing: billingFixture, termsAccepted: false }),
  });
  assert(shippingLinkRes.ok, `shipping link failed: ${JSON.stringify(shippingLinkRes.data)}`);
  console.log('✓ Linked shipping address to order (without terms)');

  const billingOnlyRes = await apiJson(`${BASE}/api/pilot-orders/billing`, {
    method: 'PATCH',
    body: JSON.stringify({ sn: TEST_SN, billing: billingFixture }),
  });
  assert(billingOnlyRes.ok, `billing save failed: ${JSON.stringify(billingOnlyRes.data)}`);
  console.log('✓ Saved customer_billing via PATCH /api/pilot-orders/billing');

  const billingRows = await supabaseGet('customer_billing', {
    select: 'company_name,signatory_name,corporate_email',
    customer_id: `eq.${customerId}`,
    limit: '1',
  });
  assert(billingRows[0]?.company_name === billingFixture.companyName, 'customer_billing row not found');
  console.log('✓ Verified customer_billing row in Supabase');

  const invoiceBlocked = await apiJson(`${BASE}/api/stripe/invoices`, {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
  assert(invoiceBlocked.status === 409, `Expected 409 without terms, got ${invoiceBlocked.status}`);
  assert(
    invoiceBlocked.data?.code === 'terms_not_accepted' || String(invoiceBlocked.data?.error || '').includes('Terms'),
    `Unexpected invoice block error: ${JSON.stringify(invoiceBlocked.data)}`,
  );
  console.log('✓ Stripe invoice blocked before terms acceptance');

  const termsRowsBefore = await supabaseGet('order_terms_acceptance', {
    select: 'id',
    order_id: `eq.${orderId}`,
    limit: '1',
  });
  assert(termsRowsBefore.length === 0, 'Terms row should not exist when termsAccepted=false');
  console.log('✓ No terms row when termsAccepted=false');

  const shippingWithTerms = await apiJson(`${BASE}/api/pilot-orders/shipping`, {
    method: 'PATCH',
    body: JSON.stringify({
      orderId,
      shippingAddressId,
      billing: billingFixture,
      termsAccepted: true,
    }),
  });
  assert(shippingWithTerms.ok, `shipping+terms failed: ${JSON.stringify(shippingWithTerms.data)}`);
  assert(shippingWithTerms.data?.termsAcceptance?.signatory_email === billingFixture.email, 'Missing termsAcceptance in response');
  console.log('✓ Recorded terms acceptance via PATCH /api/pilot-orders/shipping');

  const termsRows = await supabaseGet('order_terms_acceptance', {
    select: 'order_id,customer_id,documents,signatory_name,signatory_email,signatory_title,accepted_at',
    order_id: `eq.${orderId}`,
    limit: '1',
  });
  const terms = termsRows[0];
  assert(terms, 'order_terms_acceptance row missing');
  assert(Number(terms.customer_id) === Number(customerId), 'terms customer_id mismatch');
  assert(terms.signatory_name === billingFixture.contactName, 'signatory_name mismatch');
  assert(Array.isArray(terms.documents) && terms.documents.includes('pilot-order-service-terms'), 'documents missing terms slug');
  console.log('✓ Verified order_terms_acceptance row:', {
    order_id: terms.order_id,
    documents: terms.documents,
    signatory_email: terms.signatory_email,
  });

  const invoiceRes = await apiJson(`${BASE}/api/stripe/invoices`, {
    method: 'POST',
    body: JSON.stringify({ orderId, payerName: billingFixture.contactName }),
  });
  assert(invoiceRes.ok, `Stripe invoice should succeed after terms: ${JSON.stringify(invoiceRes.data)}`);
  assert(invoiceRes.data?.hostedInvoiceUrl, 'Missing hostedInvoiceUrl');
  console.log('✓ Stripe invoice created after terms acceptance');

  console.log('\n=== All checkout terms tests passed ===');
}

main().catch((error) => {
  console.error('\n✗ Test failed:', error.message);
  process.exit(1);
});
