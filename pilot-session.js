/**
 * Pilot session orchestration: Calendly, lead_data proxy, dashboard magic link.
 */

const crypto = require('crypto');

const DEFAULT_PILOT_DISCOUNT_RATIO = 0.8;
const DUPLICATE_EMAIL_ERROR = '此邮箱已存在，不可重复注册';

function leadDataBaseUrl() {
  return String(process.env.LEAD_DATA_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
}

function dtcDashboardBaseUrl() {
  return String(process.env.DTC_DASHBOARD_URL || 'https://dtc-dashboard.fridgechannels.com').replace(/\/$/, '');
}

function dtcDashboardApiKey() {
  return process.env.DTC_DASHBOARD_API_KEY || process.env.DTC_DASHBOARD_KEY || process.env.API_KEY || '';
}

function calendlyPat() {
  return process.env.CALENDLY_PAT || '';
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) {
    const message = payload?.error || payload?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function calendlyUserUri() {
  if (process.env.CALENDLY_USER_URI) return process.env.CALENDLY_USER_URI;
  const me = await fetchJson('https://api.calendly.com/users/me', {
    headers: { Authorization: `Bearer ${calendlyPat()}` },
  });
  return me?.resource?.uri || '';
}

function dayBounds(dateInput) {
  const base = dateInput ? new Date(`${dateInput}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) throw new Error('Invalid date');
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return { min: start.toISOString(), max: end.toISOString() };
}

async function listCalendlyEvents(date) {
  const pat = calendlyPat();
  if (!pat) {
    const error = new Error('CALENDLY_PAT is not configured');
    error.status = 503;
    throw error;
  }

  const userUri = await calendlyUserUri();
  if (!userUri) throw new Error('Calendly user URI unavailable');

  const { min, max } = dayBounds(date);
  const params = new URLSearchParams({
    user: userUri,
    min_start_time: min,
    max_start_time: max,
    status: 'active',
    count: '20',
  });

  const eventsPayload = await fetchJson(`https://api.calendly.com/scheduled_events?${params}`, {
    headers: { Authorization: `Bearer ${pat}` },
  });

  const collection = Array.isArray(eventsPayload?.collection) ? eventsPayload.collection : [];
  const events = [];

  for (const event of collection) {
    const inviteesPayload = await fetchJson(`${event.uri}/invitees`, {
      headers: { Authorization: `Bearer ${pat}` },
    });
    const invitees = (Array.isArray(inviteesPayload?.collection) ? inviteesPayload.collection : []).map((invitee) => ({
      name: invitee.name || '',
      email: invitee.email || '',
      status: invitee.status || '',
    }));

    events.push({
      uri: event.uri,
      name: event.name || '',
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      invitees,
    });
  }

  return { events, date: date || new Date().toISOString().slice(0, 10) };
}

async function resolvePilotSession(body) {
  return fetchJson(`${leadDataBaseUrl()}/api/pilot-session/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function listPackages() {
  const payload = await fetchJson(`${leadDataBaseUrl()}/api/packages?page_size=50`);
  return Array.isArray(payload?.data) ? payload.data : [];
}

async function createDashboardLoginLink({ email, next = '/' }) {
  const apiKey = dtcDashboardApiKey();
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  const payload = await fetchJson(`${dtcDashboardBaseUrl()}/api/auth/impersonate-link`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, next }),
  });

  return payload;
}

function customerIdFromRow(row) {
  if (!row || typeof row !== 'object') return null;
  const id = row.id ?? row.customer_id;
  const parsed = Number.parseInt(String(id ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function generateInitialPassword(length = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

async function findCustomerByEmail(email) {
  const base = leadDataBaseUrl();
  const payload = await fetchJson(
    `${base}/api/customers?search=${encodeURIComponent(email)}&page_size=20&offset=0`,
  );
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const normalized = String(email || '').trim().toLowerCase();
  return rows.find((row) => String(row?.email || '').trim().toLowerCase() === normalized) || null;
}

async function createCustomerAccount({ email, nickname, password }) {
  const base = leadDataBaseUrl();
  const payload = await fetchJson(`${base}/api/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      nickname: nickname || null,
      password,
      status: 3,
      verification_mode: 'skip',
    }),
  });
  const customerId = customerIdFromRow(payload?.data);
  if (!customerId) {
    const error = new Error('Customer created but id is missing in response.');
    error.status = 502;
    throw error;
  }
  return { customerId, customer: payload.data, created: true, password };
}

async function resetCustomerPassword(customerId, password) {
  const base = leadDataBaseUrl();
  await fetchJson(`${base}/api/customers/${encodeURIComponent(String(customerId))}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

async function setCustomerStatus(customerId, status) {
  const { supabaseUpdate } = require('./pilot-commerce');
  await supabaseUpdate('customer', { id: `eq.${customerId}` }, { status }, { prefer: 'return=minimal' });
}

async function resolveOrCreateCustomerId({ email, nickname, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    const error = new Error('Valid customer email is required.');
    error.status = 400;
    throw error;
  }

  try {
    return await createCustomerAccount({ email: normalizedEmail, nickname, password });
  } catch (error) {
    const duplicate =
      error.status === 400
      && (String(error.message || '').includes(DUPLICATE_EMAIL_ERROR)
        || String(error.message || '').toLowerCase().includes('duplicate')
        || String(error.message || '').includes('已存在'));
    if (!duplicate) throw error;

    const existing = await findCustomerByEmail(normalizedEmail);
    const customerId = customerIdFromRow(existing);
    if (!customerId) {
      const bindError = new Error('Email already exists but customer record could not be resolved.');
      bindError.status = 409;
      throw bindError;
    }
    await resetCustomerPassword(customerId, password);
    await setCustomerStatus(customerId, 3);
    return { customerId, customer: existing, created: false, password, passwordReset: true };
  }
}

async function storePilotLoginCredentials({ sn, email, password }) {
  const base = leadDataBaseUrl();
  return fetchJson(`${base}/api/samples/${encodeURIComponent(sn)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pilot_login_email: email,
      pilot_initial_password: password,
    }),
  });
}

async function bindPilotCustomerAccount({ sn, email, nickname }) {
  const magnetSn = String(sn || '').trim();
  if (!magnetSn) {
    const error = new Error('sn is required.');
    error.status = 400;
    throw error;
  }

  const requestedEmail = String(email || '').trim().toLowerCase();
  if (!requestedEmail || !requestedEmail.includes('@')) {
    const error = new Error('Valid customer email is required.');
    error.status = 400;
    throw error;
  }

  const base = leadDataBaseUrl();
  const samplePayload = await fetchJson(`${base}/api/samples/${encodeURIComponent(magnetSn)}`);
  const sample = samplePayload?.data;
  if (!sample) {
    const error = new Error('Sample not found for this magnet SN.');
    error.status = 404;
    throw error;
  }

  const existingCustomerId = customerIdFromRow({ id: sample.customer_id });
  const storedEmail = String(sample.pilot_login_email || '').trim().toLowerCase();
  const storedPassword = String(sample.pilot_initial_password || '').trim();

  // Already bound: reuse stored credentials when available; otherwise reset and save.
  if (existingCustomerId) {
    const boundEmail = String(sample.customer?.email || '').trim().toLowerCase();
    if (boundEmail && boundEmail !== requestedEmail) {
      const error = new Error('Sample already has a different customer account bound.');
      error.status = 409;
      throw error;
    }

    let password = storedPassword;
    let passwordIssued = false;
    if (!password || (storedEmail && storedEmail !== requestedEmail)) {
      password = generateInitialPassword();
      await resetCustomerPassword(existingCustomerId, password);
      await storePilotLoginCredentials({ sn: magnetSn, email: requestedEmail, password });
      passwordIssued = true;
    }
    await setCustomerStatus(existingCustomerId, 3);

    return {
      sn: magnetSn,
      customer_id: existingCustomerId,
      customer: sample.customer || { id: existingCustomerId, email: requestedEmail || boundEmail },
      created: false,
      bound: false,
      password_issued: passwordIssued,
      credentials: {
        email: requestedEmail || storedEmail || boundEmail,
        password,
      },
    };
  }

  const password = generateInitialPassword();
  const { customerId, customer, created, passwordReset } = await resolveOrCreateCustomerId({
    email: requestedEmail,
    nickname,
    password,
  });
  await setCustomerStatus(customerId, 3);

  const patchPayload = await fetchJson(`${base}/api/samples/${encodeURIComponent(magnetSn)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customerId,
      pilot_login_email: requestedEmail,
      pilot_initial_password: password,
    }),
  });

  return {
    sn: magnetSn,
    customer_id: customerId,
    customer: patchPayload?.data || customer,
    created,
    bound: true,
    password_issued: true,
    password_reset: Boolean(passwordReset),
    credentials: {
      email: requestedEmail,
      password,
    },
  };
}

module.exports = {
  DEFAULT_PILOT_DISCOUNT_RATIO,
  listCalendlyEvents,
  resolvePilotSession,
  listPackages,
  createDashboardLoginLink,
  bindPilotCustomerAccount,
  leadDataBaseUrl,
  dtcDashboardBaseUrl,
};
