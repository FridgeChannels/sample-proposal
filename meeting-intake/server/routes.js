const { createAboutPilotApplication } = require('./notion')
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
} = require('./security')

const DEFAULT_ROUTES = {
  formToken: '/api/about-pilot/form-token',
  apply: '/api/about-pilot/apply',
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw || raw.length > 1_000_000) throw new Error('Invalid request body')
  return JSON.parse(raw)
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function normalizedChannel(raw) {
  const value = String(raw || '').trim().toUpperCase()
  if (value === 'DTC') return 'DTC'
  if (value === 'AMAZON' || value === 'ASIN' || value === 'ASIN_PLUS') return 'AMAZON'
  return ''
}

/**
 * Handle the form-token and application routes for a meeting-intake module.
 * Returns true when the request was handled, otherwise false.
 */
async function handleMeetingIntakeRequest(req, res, requestUrl, {
  routes = DEFAULT_ROUTES,
  createApplication = createAboutPilotApplication,
  dedupeNamespace = 'ABOUT',
} = {}) {
  if (requestUrl.pathname === routes.formToken && req.method === 'GET') {
    try {
      assertAllowedOrigin(req)
      assertTokenRateLimit(clientIp(req))
      sendJson(res, 200, issueFormToken())
    } catch (error) {
      if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter))
      sendJson(res, error.status || 500, {
        error: error.message || 'Unable to issue form token.',
        code: error.code || 'form_token_failed',
      })
    }
    return true
  }

  if (requestUrl.pathname !== routes.apply) return false
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return true
  }

  try {
    const contentType = String(req.headers['content-type'] || '')
    if (!contentType.toLowerCase().includes('application/json')) {
      sendJson(res, 415, { error: 'Content-Type must be application/json.', code: 'unsupported_media_type' })
      return true
    }

    assertAllowedOrigin(req)
    const body = await readJsonBody(req)
    assertFormToken(body.formToken)
    const email = normalizeEmail(body.email)
    const channel = normalizedChannel(body.channel)
    assertRateLimits({ ip: clientIp(req), email })

    if (email && channel) {
      const existing = getRecentApplication(email, `${dedupeNamespace}:${channel}`)
      if (existing) {
        sendJson(res, 409, {
          ok: false,
          alreadyApplied: true,
          pageId: existing.pageId,
          url: existing.url,
          channel,
          code: 'already_applied',
          error: 'This work email already submitted an application. Please wait for our follow-up, or use a different work email.',
        })
        return true
      }
    }

    const result = await createApplication(body)
    if (!result?.pageId) {
      sendJson(res, 502, {
        ok: false,
        code: 'notion_save_failed',
        error: "We couldn't save your application. Please try again — booking opens only after it is saved successfully.",
      })
      return true
    }

    rememberApplication(result.email || email, `${dedupeNamespace}:${result.channel}`, result)
    sendJson(res, 201, { ok: true, pageId: result.pageId, url: result.url, channel: result.channel })
  } catch (error) {
    console.error('[meeting-intake/apply]', error?.message, error?.code)
    if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter))
    const notionFailed = error.code === 'notion_api_error' || error.code === 'notion_token_missing' || error.status === 502
    sendJson(res, error.status || 500, {
      ok: false,
      error: notionFailed
        ? "We couldn't save your application right now. Please try again in a moment — booking opens only after it is saved successfully."
        : (error.message || "We couldn't save your application. Please try again."),
      code: error.code || 'meeting_intake_apply_failed',
    })
  }
  return true
}

module.exports = { DEFAULT_ROUTES, handleMeetingIntakeRequest }
