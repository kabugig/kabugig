/* Card analytics for gibson.seepu.co.ke
 *
 * POST /api/track  { type: "view"|"scan"|"click", target?: string }
 * POST /api/stats  { password }  ->  all-time aggregates for the dashboard
 *
 * Two stores:
 *  - KV: one entry per event, kept forever, newest first. Used for the
 *    "recent activity" feed and as the raw log.
 *  - Durable Object (SQLite): all-time daily counters, updated atomically.
 *    This is what the dashboard totals, chart and rankings read, so they
 *    never drop old events.
 * No IP addresses are stored: only country and city from Cloudflare's
 * request data, device class, and the event itself.
 */
import { DurableObject } from 'cloudflare:workers';

const SITE = 'https://gibson.seepu.co.ke';
const TYPES = new Set(['view', 'scan', 'click']);
const TARGETS = new Set(['save', 'call', 'whatsapp', 'email', 'linkedin', 'github', 'photography', 'portfolio', 'qr']);
const PAGES = 5;                      // backfill reads up to 5 x 1000 legacy events
const TS_CEIL = 9e12;                 // key = ceil - ts, so newest sorts first
const TZ_OFFSET = 3 * 3600 * 1000;    // Africa/Nairobi, UTC+3
const BOT = /bot|crawl|spider|preview|headless|facebookexternalhit|slurp|monitor/i;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const dayOf = (ts) => new Date(ts + TZ_OFFSET).toISOString().slice(0, 10);

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(buf);
}

async function safeEqual(a, b) {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > 1024) return null;
  try { return JSON.parse(text); } catch { return null; }
}

/* ---------- all-time counters ---------- */

export class Stats extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      'CREATE TABLE IF NOT EXISTS counters (day TEXT NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, kind, key))'
    );
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)');
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
    const done = this.sql.exec("SELECT v FROM meta WHERE k = 'backfilled'").toArray();
    if (done.length) return false;
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
      rows.filter((r) => r.kind === kind).sort((a, b) => b.n - a.n)
        .map((r) => ({ name: r.key, count: r.n }));
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

/* ---------- tracking ---------- */

async function track(request, env) {
  const body = await readBody(request);
  if (!body || !TYPES.has(body.type)) return json({ error: 'bad request' }, 400);
  if (body.type === 'click' && !TARGETS.has(body.target)) return json({ error: 'bad request' }, 400);

  const ua = request.headers.get('user-agent') || '';
  if (BOT.test(ua)) return new Response(null, { status: 204 });

  const cf = request.cf || {};
  const device = /ipad|tablet/i.test(ua) ? 't' : /mobi|android|iphone/i.test(ua) ? 'm' : 'd';
  const ts = Date.now();
  const rand = crypto.randomUUID().slice(0, 8);
  const key = 'e:' + String(TS_CEIL - ts).padStart(13, '0') + ':' + rand;
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
    env.EVENTS.put(key, '1', { metadata: { t: event.t, g: event.g, c: event.c, ci: event.ci, d: event.d, r: 1 } }),
    counters(env).record(event),
  ]);
  return new Response(null, { status: 204 });
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

/* ---------- dashboard ---------- */

async function stats(request, env) {
  const body = await readBody(request);
  const password = body && typeof body.password === 'string' ? body.password : '';
  if (!env.DASH_PASSWORD) return json({ error: 'not configured' }, 500);

  // throttle guesses per client (hashed, never stored raw)
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const id = Array.from(await sha256('rl:' + ip)).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
  const rlKey = 'rl:' + id;
  const tries = parseInt((await env.EVENTS.get(rlKey)) || '0', 10);
  if (tries >= 10) return json({ error: 'too many attempts, try again later' }, 429);

  if (!(await safeEqual(password, env.DASH_PASSWORD))) {
    await env.EVENTS.put(rlKey, String(tries + 1), { expirationTtl: 900 });
    return json({ error: 'wrong password' }, 401);
  }

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
    const url = new URL(request.url);
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
    if (request.headers.get('origin') !== SITE) return json({ error: 'forbidden' }, 403);

    if (url.pathname === '/api/track') return track(request, env);
    if (url.pathname === '/api/stats') return stats(request, env);
    return json({ error: 'not found' }, 404);
  },
};
