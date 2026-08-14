const crypto = require('crypto');

const COOKIE_NAME = 'fc_pilot_ops';
const DEFAULT_TTL_DAYS = 90;

let warnedOpenAccess = false;

function getAccessKey() {
  return String(process.env.PILOT_OPS_ACCESS_KEY || '').trim();
}

function getCookieSecret() {
  return String(process.env.PILOT_OPS_COOKIE_SECRET || process.env.PILOT_OPS_ACCESS_KEY || 'fc-pilot-ops-dev').trim();
}

function isAuthConfigured() {
  return Boolean(getAccessKey());
}

function parseCookies(req) {
  const header = String(req.headers?.cookie || '');
  const cookies = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function safeCompare(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function signToken(expiryMs) {
  const payload = String(expiryMs);
  const sig = crypto.createHmac('sha256', getCookieSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expiryStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', getCookieSecret()).update(expiryStr).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
  const expiry = Number(expiryStr);
  return Number.isFinite(expiry) && Date.now() <= expiry;
}

function getCookieFromRequest(req) {
  return parseCookies(req)[COOKIE_NAME] || '';
}

function isAuthenticated(req) {
  if (!isAuthConfigured()) {
    if (!warnedOpenAccess) {
      warnedOpenAccess = true;
      console.warn('[pilot-ops-auth] PILOT_OPS_ACCESS_KEY is unset — /pilot-plan routes are open');
    }
    return true;
  }
  return verifyToken(getCookieFromRequest(req));
}

function cookieTtlSeconds() {
  const days = Number(process.env.PILOT_OPS_COOKIE_TTL_DAYS || DEFAULT_TTL_DAYS);
  return Math.max(1, Number.isFinite(days) ? days : DEFAULT_TTL_DAYS) * 86400;
}

function isSecureRequest(req) {
  if (process.env.PILOT_OPS_COOKIE_SECURE === 'true') return true;
  if (process.env.PILOT_OPS_COOKIE_SECURE === 'false') return false;
  const forwarded = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (forwarded === 'https') return true;
  return process.env.NODE_ENV === 'production';
}

function buildSetCookie(name, value, req, { maxAge } = {}) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  if (isSecureRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function setAuthCookie(res, req) {
  const expiryMs = Date.now() + cookieTtlSeconds() * 1000;
  const token = signToken(expiryMs);
  res.setHeader('Set-Cookie', buildSetCookie(COOKIE_NAME, token, req, { maxAge: cookieTtlSeconds() }));
}

function clearAuthCookie(res, req) {
  res.setHeader('Set-Cookie', buildSetCookie(COOKIE_NAME, '', req, { maxAge: 0 }));
}

function isPilotOpsLoginPath(pathname) {
  return pathname === '/pilot-plan/login' || pathname === '/pilot-plan/login/';
}

function isPilotOpsAuthApiPath(pathname) {
  return pathname === '/api/pilot-plan/auth' || pathname === '/api/pilot-plan/logout';
}

function isPilotOpsProtectedPath(pathname) {
  if (isPilotOpsLoginPath(pathname) || isPilotOpsAuthApiPath(pathname)) return false;
  if (pathname === '/pilot-plan' || pathname === '/pilot-plan/') return true;
  if (pathname.startsWith('/pilot-plan/')) return true;
  if (pathname === '/pilot-plan.html' || pathname === '/pilot-plan-prep.html') return true;
  if (pathname === '/api/calendly/events') return true;
  if (pathname.startsWith('/api/pilot-session')) return true;
  if (pathname.startsWith('/api/pilot-plan/')) return true;
  return false;
}

function redirectToLogin(res, returnUrl) {
  const safeReturn = String(returnUrl || '/pilot-plan/prep').startsWith('/')
    ? String(returnUrl || '/pilot-plan/prep')
    : '/pilot-plan/prep';
  res.writeHead(302, { Location: `/pilot-plan/login?return=${encodeURIComponent(safeReturn)}` });
  res.end();
}

function verifyPassword(password) {
  const key = getAccessKey();
  if (!key) return false;
  return safeCompare(String(password || ''), key);
}

async function handleAuthLogin(req, res, readJsonBody, sendJson) {
  if (!isAuthConfigured()) {
    await sendJson(res, 503, { error: 'Pilot ops access key is not configured on the server.' });
    return;
  }
  try {
    const body = await readJsonBody(req);
    const password = String(body.password || body.access_key || body.key || '').trim();
    if (!verifyPassword(password)) {
      await sendJson(res, 401, { error: 'Invalid access key.', code: 'pilot_ops_invalid_key' });
      return;
    }
    setAuthCookie(res, req);
    await sendJson(res, 200, { ok: true });
  } catch (error) {
    await sendJson(res, 400, { error: error.message || 'Invalid request.' });
  }
}

async function handleAuthLogout(req, res, sendJson) {
  clearAuthCookie(res, req);
  await sendJson(res, 200, { ok: true });
}

module.exports = {
  COOKIE_NAME,
  isAuthConfigured,
  isAuthenticated,
  isPilotOpsLoginPath,
  isPilotOpsProtectedPath,
  redirectToLogin,
  setAuthCookie,
  clearAuthCookie,
  handleAuthLogin,
  handleAuthLogout,
};
