/**
 * P0+P1 guards for Christmas campaign apply:
 * rate limits, origin check, form timing token, dedupe.
 */

const crypto = require('crypto')

// TEMP: set to 0 to disable min-fill guard locally; restore to 5_000 before ship
const MIN_FILL_MS = 0
const MAX_FILL_MS = 2 * 60 * 60 * 1000
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000

const LIMITS = {
  ipWindow10m: { limit: 5, windowMs: 10 * 60 * 1000 },
  ipWindow24h: { limit: 20, windowMs: 24 * 60 * 60 * 1000 },
  emailWindow24h: { limit: 2, windowMs: 24 * 60 * 60 * 1000 },
  globalWindow1m: { limit: 60, windowMs: 60 * 1000 },
  tokenWindow1m: { limit: 30, windowMs: 60 * 1000 },
}

const hitBuckets = new Map()
const dedupeStore = new Map()

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
  'https://dealquest.fridgechannels.com',
]

function httpError(status, code, message, extra = {}) {
  const error = new Error(message)
  error.status = status
  error.code = code
  Object.assign(error, extra)
  return error
}

function formSecret() {
  return (
    process.env.CHRISTMAS_CAMPAIGN_FORM_SECRET
    || process.env.PILOT_OPS_COOKIE_SECRET
    || process.env.PILOT_OPS_ACCESS_KEY
    || process.env.NOTION_API_TOKEN
    || 'dev-christmas-campaign-form-secret'
  )
}

function allowedOrigins() {
  const fromEnv = String(process.env.CHRISTMAS_CAMPAIGN_ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv])
}

function clientIp(req) {
  const cf = String(req.headers['cf-connecting-ip'] || '').trim()
  if (cf) return cf
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  if (forwarded) return forwarded
  const realIp = String(req.headers['x-real-ip'] || '').trim()
  if (realIp) return realIp
  return String(req.socket?.remoteAddress || 'unknown')
}

function pruneHits(key, windowMs, now) {
  const current = hitBuckets.get(key) || []
  const next = current.filter((ts) => now - ts < windowMs)
  if (next.length) hitBuckets.set(key, next)
  else hitBuckets.delete(key)
  return next
}

function recordHit(key, windowMs, limit) {
  const now = Date.now()
  const hits = pruneHits(key, windowMs, now)
  if (hits.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000))
    return { ok: false, retryAfter }
  }
  hits.push(now)
  hitBuckets.set(key, hits)
  return { ok: true }
}

function assertRateLimits({ ip, email }) {
  const checks = [
    { key: `global:1m`, ...LIMITS.globalWindow1m },
    { key: `ip:10m:${ip}`, ...LIMITS.ipWindow10m },
    { key: `ip:24h:${ip}`, ...LIMITS.ipWindow24h },
  ]
  if (email) checks.push({ key: `email:24h:${email}`, ...LIMITS.emailWindow24h })

  for (const check of checks) {
    const result = recordHit(check.key, check.windowMs, check.limit)
    if (!result.ok) {
      throw httpError(429, 'rate_limited', 'Too many requests. Please try again later.', {
        retryAfter: result.retryAfter,
      })
    }
  }
}

function assertTokenRateLimit(ip) {
  const result = recordHit(`token:1m:${ip}`, LIMITS.tokenWindow1m.windowMs, LIMITS.tokenWindow1m.limit)
  if (!result.ok) {
    throw httpError(429, 'rate_limited', 'Too many requests. Please try again later.', {
      retryAfter: result.retryAfter,
    })
  }
}

function assertAllowedOrigin(req) {
  const allowlist = allowedOrigins()
  const host = String(req.headers.host || '').trim().toLowerCase()
  const originHeader = String(req.headers.origin || '').trim()
  const refererHeader = String(req.headers.referer || '').trim()

  const candidates = []
  if (originHeader) candidates.push(originHeader)
  if (refererHeader) {
    try {
      candidates.push(new URL(refererHeader).origin)
    } catch {
      // ignore bad referer
    }
  }

  if (!candidates.length) {
    throw httpError(403, 'forbidden_origin', 'Request origin is not allowed.')
  }

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate)
      if (allowlist.has(parsed.origin)) return
      if (host && parsed.host.toLowerCase() === host) return
    } catch {
      // continue
    }
  }

  throw httpError(403, 'forbidden_origin', 'Request origin is not allowed.')
}

function signPayload(payload) {
  return crypto.createHmac('sha256', formSecret()).update(payload).digest('base64url')
}

function issueFormToken() {
  const issuedAt = Date.now()
  const payload = String(issuedAt)
  const token = `${payload}.${signPayload(payload)}`
  return { token, issuedAt, minFillSeconds: Math.ceil(MIN_FILL_MS / 1000) }
}

function assertFormToken(token) {
  const value = String(token || '')
  const parts = value.split('.')
  if (parts.length !== 2) {
    throw httpError(403, 'invalid_form_token', 'Please refresh the page and try again.')
  }
  const [issuedRaw, signature] = parts
  const expected = signPayload(issuedRaw)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw httpError(403, 'invalid_form_token', 'Please refresh the page and try again.')
  }
  const issuedAt = Number(issuedRaw)
  if (!Number.isFinite(issuedAt)) {
    throw httpError(403, 'invalid_form_token', 'Please refresh the page and try again.')
  }
  const age = Date.now() - issuedAt
  if (age < MIN_FILL_MS) {
    throw httpError(400, 'form_too_fast', 'Please take a moment to complete the form, then try again.')
  }
  if (age > MAX_FILL_MS) {
    throw httpError(403, 'form_token_expired', 'This form session expired. Please refresh the page and try again.')
  }
  return issuedAt
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function dedupeKey(email, channel) {
  return `${normalizeEmail(email)}|${String(channel || '').toUpperCase()}`
}

function getRecentApplication(email, channel) {
  const key = dedupeKey(email, channel)
  const existing = dedupeStore.get(key)
  if (!existing) return null
  if (Date.now() - existing.at > DEDUPE_TTL_MS) {
    dedupeStore.delete(key)
    return null
  }
  return existing
}

function rememberApplication(email, channel, result) {
  dedupeStore.set(dedupeKey(email, channel), {
    at: Date.now(),
    pageId: result.pageId || null,
    url: result.url || null,
  })
}

module.exports = {
  clientIp,
  assertAllowedOrigin,
  assertRateLimits,
  assertTokenRateLimit,
  issueFormToken,
  assertFormToken,
  normalizeEmail,
  getRecentApplication,
  rememberApplication,
  LIMITS,
  MIN_FILL_MS,
  MAX_FILL_MS,
}
