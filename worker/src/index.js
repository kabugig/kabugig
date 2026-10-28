/* Card analytics for gibson.seepu.co.ke
 *
 * POST /api/track   { type: "view"|"scan"|"click", target?: string }
 * POST /api/login   { password }  ->  204 + signed HttpOnly session cookie
 * POST /api/logout                ->  204 + cookie cleared
 * POST /api/stats                 ->  all-time aggregates (requires the cookie)
 *
 * Stores:
 *  - Durable Object (SQLite): all-time daily counters, rate-limit windows.
 *    Atomic and strongly consistent, so neither counts nor throttles can be
 *    raced.
 *  - KV: one entry per event (raw log, feeds the recent-activity list).
 *    Best effort: the counters stay correct even if KV writes fail.
 *
 * No IP addresses are stored. Client IPs are only used transiently, salted
 * and hashed, as rate-limit keys that expire within minutes.
 */
import { DurableObject } from 'cloudflare:workers';

const SITE = 'https://gibson.seepu.co.ke';
const TYPES = new Set(['view', 'scan', 'click']);
const TARGETS = new Set(['save', 'call', 'whatsapp', 'email', 'linkedin', 'github', 'photography', 'portfolio', 'qr']);
const PAGES = 5;                       // one-time backfill reads up to 5 x 1000 legacy events
const TS_CEIL = 9e12;                  // KV key = ceil - ts, so newest sorts first
const TZ_OFFSET = 3 * 3600 * 1000;     // Africa/Nairobi, UTC+3
const BOT = /bot|crawl|spider|preview|headless|facebookexternalhit|slurp|monitor/i;

const COOKIE = 'gk_dash';
const SESSION_SECONDS = 3600;
const MAX_BODY = 1024;

// rate limits (fixed windows, per hashed client unless noted)
const LIMITS = {
  track: { max: 60, windowMs: 60_000 },          // events per client per minute
  trackAll: { max: 600, windowMs: 60_000 },      // events across everyone per minute
  loginFail: { max: 8, windowMs: 15 * 60_000 },  // failed logins per client per 15 min
};

const SECURITY_HEADERS = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
};

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, 'content-type': 'application/json', ...extra },
  });

const empty = (status = 204, extra = {}) => new Response(null, { status, headers: { ...SECURITY_HEADERS, ...extra } });

const dayOf = (ts) => new Date(ts + TZ_OFFSET).toISOString().slice(0, 10);

const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function safeEqual(a, b) {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function readBody(request) {
  const declared = parseInt(request.headers.get('content-length') || '0', 10);
  if (declared > MAX_BODY) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try { return JSON.parse(text); } catch { return null; }
}

/* ---------- sessions: signed, expiring, HttpOnly cookie ---------- */

async function hmacKey(env) {
  // Derived from the dashboard password, so rotating the password signs everyone out.
  return crypto.subtle.importKey('raw', enc.encode('gk-session-v1:' + env.DASH_PASSWORD),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function issueSession(env) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env), enc.encode(String(exp)));
  return exp + '.' + b64url(sig);
}

async function hasSession(request, env) {
  const raw = request.headers.get('cookie') || '';
  const m = raw.split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!m) return false;
  const [exp, sig] = m.slice(COOKIE.length + 1).split('.');
  if (!/^\d{10}$/.test(exp || '') || !sig || parseInt(exp, 10) < Date.now() / 1000) return false;
  try {
    return await crypto.subtle.verify('HMAC', await hmacKey(env), unb64url(sig), enc.encode(exp));
  } catch {
    return false;
  }
}

const cookieHeader = (value, maxAge) =>
  `${COOKIE}=${value}; Max-Age=${maxAge}; Path=/api; HttpOnly; Secure; SameSite=Strict`;

/* ---------- Durable Object: counters + rate limits ---------- */

export class Stats extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      'CREATE TABLE IF NOT EXISTS counters (day TEXT NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, kind, key))'
    );
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS rl (k TEXT PRIMARY KEY, n INTEGER NOT NULL, reset_at INTEGER NOT NULL)');
  }

  /* fixed-window limiter; returns true when the call is allowed */
  async take(key, max, windowMs) {
    const now = Date.now();
    const row = this.sql.exec('SELECT n, reset_at FROM rl WHERE k = ?', key).toArray()[0];
    if (!row || row.reset_at <= now) {
      this.sql.exec('INSERT OR REPLACE INTO rl (k, n, reset_at) VALUES (?, 1, ?)', key, now + windowMs);
      if (Math.random() < 0.02) this.sql.exec('DELETE FROM rl WHERE reset_at <= ?', now);
      return true;
    }
    if (row.n >= max) return false;
    this.sql.exec('UPDATE rl SET n = n + 1 WHERE k = ?', key);
    return true;
  }

  /* gives back one unit, used when a login that was counted up front succeeds */
  async refund(key) {
    this.sql.exec('UPDATE rl SET n = MAX(n - 1, 0) WHERE k = ?', key);
  }

  bump(day, kind, key) {
    this.sql.exec(
      'INSERT INTO counters (day, kind, key, n) VALUES (?, ?, ?, 1) ON CONFLICT (day, kind, key) DO UPDATE SET n = n + 1',
      day, kind, key
    );
  }

  apply(e) {
    const day = dayOf(e.ts);
    this.bump(day, 'type', e.t);
    if (e.t === 'click') {
      this.bump(day, 'click', e.g || 'other');
    } else {
      this.bump(day, 'country', e.c || '??');
      if (e.ci) this.bump(day, 'city', e.ci + (e.c ? ', ' + e.c : ''));
      this.bump(day, 'device', e.d === 'm' ? 'Mobile' : e.d === 't' ? 'Tablet' : 'Desktop');
    }
  }

  async record(e) {
    this.apply(e);
  }

  /* one-time import of events that existed before the counters did */
  async backfill(events) {
    if (this.sql.exec("SELECT v FROM meta WHERE k = 'backfilled'").toArray().length) return false;
    this.ctx.storage.transactionSync(() => {
      for (const e of events) this.apply(e);
      this.sql.exec("INSERT INTO meta (k, v) VALUES ('backfilled', '1')");
    });
    return true;
  }

  async isBackfilled() {
    return this.sql.exec("SELECT v FROM meta WHERE k = 'backfilled'").toArray().length > 0;
  }

  async summary(days) {
    const rows = this.sql.exec('SELECT kind, key, SUM(n) AS n FROM counters GROUP BY kind, key').toArray();
    const pick = (kind) =>
      rows.filter((r) => r.kind === kind).sort((a, b) => b.n - a.n).map((r) => ({ name: r.key, count: r.n }));
    const type = Object.fromEntries(pick('type').map((r) => [r.name, r.count]));

    const start = dayOf(Date.now() - (days - 1) * 86400000);
    const perDay = new Map();
    for (let i = days - 1; i >= 0; i--) {
      perDay.set(dayOf(Date.now() - i * 86400000), { views: 0, scans: 0, clicks: 0 });
    }
    const dayRows = this.sql
      .exec("SELECT day, key, n FROM counters WHERE kind = 'type' AND day >= ?", start)
      .toArray();
    for (const r of dayRows) {
      const d = perDay.get(r.day);
      if (d) d[r.key === 'scan' ? 'scans' : r.key === 'click' ? 'clicks' : 'views'] += r.n;
    }
    const first = this.sql.exec('SELECT MIN(day) AS d FROM counters').toArray()[0];

    return {
      totals: { views: type.view || 0, scans: type.scan || 0, clicks: type.click || 0 },
      days: [...perDay.entries()].map(([date, v]) => ({ date, ...v })),
      clicks: pick('click').slice(0, 10),
      countries: pick('country').slice(0, 10),
      cities: pick('city').slice(0, 10),
      devices: pick('device').slice(0, 5),
      since: first ? first.d : null,
    };
  }
}

const counters = (env) => env.STATS.get(env.STATS.idFromName('main'));

async function clientKey(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const h = await sha256('client:' + (env.DASH_PASSWORD || '') + ':' + ip);
  return Array.from(h.slice(0, 10)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- handlers ---------- */

async function track(request, env) {
  const body = await readBody(request);
  if (!body || !TYPES.has(body.type)) return json({ error: 'bad request' }, 400);
  if (body.type === 'click' && !TARGETS.has(body.target)) return json({ error: 'bad request' }, 400);

  const ua = request.headers.get('user-agent') || '';
  if (BOT.test(ua)) return empty();

  const store = counters(env);
  const who = await clientKey(request, env);
  const [okClient, okAll] = await Promise.all([
    store.take('t:' + who, LIMITS.track.max, LIMITS.track.windowMs),
    store.take('t:all', LIMITS.trackAll.max, LIMITS.trackAll.windowMs),
  ]);
  if (!okClient || !okAll) return empty(429, { 'retry-after': '60' });

  const cf = request.cf || {};
  const device = /ipad|tablet/i.test(ua) ? 't' : /mobi|android|iphone/i.test(ua) ? 'm' : 'd';
  const ts = Date.now();
  const key = 'e:' + String(TS_CEIL - ts).padStart(13, '0') + ':' + crypto.randomUUID().slice(0, 8);
  const event = {
    ts,
    t: body.type,
    g: body.type === 'click' ? body.target : undefined,
    c: cf.country || '??',
    ci: cf.city || '',
    d: device,
  };

  // r: 1 marks events already counted, so the one-time backfill skips them
  await Promise.all([
    env.EVENTS.put(key, '1', { metadata: { t: event.t, g: event.g, c: event.c, ci: event.ci, d: event.d, r: 1 } })
      .catch(() => {}),
    store.record(event),
  ]);
  return empty();
}

async function login(request, env) {
  if (!env.DASH_PASSWORD) return json({ error: 'not configured' }, 500);
  const store = counters(env);
  const who = 'f:' + (await clientKey(request, env));

  // Count the attempt before checking it. Checking first and counting after left a gap
  // in which a burst of parallel guesses all passed the check; one atomic take closes it.
  if (!(await store.take(who, LIMITS.loginFail.max, LIMITS.loginFail.windowMs))) {
    return json({ error: 'too many attempts, try again later' }, 429, { 'retry-after': '900' });
  }

  const body = await readBody(request);
  const password = body && typeof body.password === 'string' ? body.password : '';
  if (!password || !(await safeEqual(password, env.DASH_PASSWORD))) {
    return json({ error: 'wrong password' }, 401);
  }
  await store.refund(who); // a correct password does not use up the allowance
  return empty(204, { 'set-cookie': cookieHeader(await issueSession(env), SESSION_SECONDS) });
}

async function listEvents(env, { pages, limit }) {
  const events = [];
  let cursor;
  for (let i = 0; i < pages; i++) {
    const page = await env.EVENTS.list({ prefix: 'e:', limit, cursor });
    for (const k of page.keys) {
      const ts = TS_CEIL - parseInt(k.name.slice(2, 15), 10);
      events.push({ ts, ...(k.metadata || {}) });
    }
    if (page.list_complete) break;
    cursor = page.cursor;
  }
  return events;
}

async function stats(request, env) {
  if (!env.DASH_PASSWORD) return json({ error: 'not configured' }, 500);
  if (!(await hasSession(request, env))) return json({ error: 'unauthorized' }, 401);

  const store = counters(env);

  // first run after the counters were introduced: import legacy events once
  if (!(await store.isBackfilled())) {
    const legacy = (await listEvents(env, { pages: PAGES, limit: 1000 })).filter((e) => !e.r);
    await store.backfill(legacy);
  }

  const [summary, recent] = await Promise.all([
    store.summary(14),
    listEvents(env, { pages: 1, limit: 20 }),
  ]);
  return json({ ...summary, recent });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, { allow: 'POST' });
      if (request.headers.get('origin') !== SITE) return json({ error: 'forbidden' }, 403);

      switch (url.pathname) {
        case '/api/track': return await track(request, env);
        case '/api/login': return await login(request, env);
        case '/api/logout': return empty(204, { 'set-cookie': cookieHeader('', 0) });
        case '/api/stats': return await stats(request, env);
        default: return json({ error: 'not found' }, 404);
      }
    } catch {
      return json({ error: 'server error' }, 500);
    }
  },
};
