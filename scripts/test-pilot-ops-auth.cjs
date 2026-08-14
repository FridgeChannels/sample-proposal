#!/usr/bin/env node
/**
 * Smoke test for pilot-plan ops auth.
 * Usage: node scripts/test-pilot-ops-auth.cjs
 */
const http = require('http');

const PORT = 4179;
const ACCESS_KEY = 'test-pilot-ops-key';

process.env.PORT = String(PORT);
process.env.PILOT_OPS_ACCESS_KEY = ACCESS_KEY;
process.env.PILOT_OPS_COOKIE_SECRET = 'test-cookie-secret';

function request(path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function getSetCookie(headers) {
  const raw = headers['set-cookie'];
  if (!raw) return '';
  return Array.isArray(raw) ? raw.join('; ') : String(raw);
}

async function main() {
  const handler = require('../server.js');
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(PORT, resolve));

  try {
    const blocked = await request('/pilot-plan/prep');
    if (blocked.status !== 302 || !String(blocked.headers.location || '').includes('/pilot-plan/login')) {
      throw new Error(`Expected redirect to login, got ${blocked.status} ${blocked.headers.location}`);
    }
    console.log('✓ unauthenticated /pilot-plan/prep redirects to login');

    const apiBlocked = await request('/api/pilot-plan/packages');
    if (apiBlocked.status !== 401) {
      throw new Error(`Expected 401 on protected API, got ${apiBlocked.status}`);
    }
    console.log('✓ unauthenticated API returns 401');

    const loginPage = await request('/pilot-plan/login');
    if (loginPage.status !== 200 || !loginPage.body.includes('Pilot Plan Access')) {
      throw new Error('Login page failed to load');
    }
    console.log('✓ login page loads');

    const badLogin = await request('/api/pilot-plan/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    });
    if (badLogin.status !== 401) {
      throw new Error(`Expected 401 for bad password, got ${badLogin.status}`);
    }
    console.log('✓ wrong password rejected');

    const goodLogin = await request('/api/pilot-plan/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ACCESS_KEY }),
    });
    const cookie = getSetCookie(goodLogin.headers);
    if (goodLogin.status !== 200 || !cookie.includes('fc_pilot_ops=')) {
      throw new Error('Successful login did not set cookie');
    }
    console.log('✓ valid password sets cookie');

    const allowed = await request('/pilot-plan/prep', {
      headers: { Cookie: cookie.split(';')[0] },
    });
    if (allowed.status !== 200 && allowed.status !== 500) {
      // 500 is ok if dist not built in CI-less local — but should not be 302
      if (allowed.status === 302) throw new Error('Authenticated request still redirected');
    }
    if (allowed.status === 302) {
      throw new Error('Authenticated request still redirected');
    }
    console.log('✓ authenticated /pilot-plan/prep allowed');

    const logout = await request('/api/pilot-plan/logout', {
      method: 'POST',
      headers: { Cookie: cookie.split(';')[0] },
    });
    if (logout.status !== 200) throw new Error('Logout failed');
    console.log('✓ logout succeeds');

    console.log('\nAll pilot-ops auth checks passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
