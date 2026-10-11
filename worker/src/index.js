/* Card analytics for gibson.seepu.co.ke
 *
 * POST /api/track  { type: "view"|"scan"|"click", target?: string }
 * POST /api/stats  { password }  ->  aggregates for the dashboard
 *
 * Events are stored one per KV key (newest first by key order), with the
 * payload in key metadata so a dashboard read is a handful of list calls.
 * No IP addresses are stored: only country and city from Cloudflare's
 * request data, device class, and the event itself.
 */

const SITE = 'https://gibson.seepu.co.ke';
const TYPES = new Set(['view', 'scan', 'click']);
const TARGETS = new Set(['save', 'call', 'whatsapp', 'email', 'linkedin', 'github', 'photography', 'portfolio', 'qr']);
const TTL = 60 * 60 * 24 * 180;      // keep events 180 days
const PAGES = 5;                      // dashboard reads up to 5 x 1000 events
const TS_CEIL = 9e12;                 // key = ceil - ts, so newest sorts first
const TZ_OFFSET = 3 * 3600 * 1000;    // Africa/Nairobi, UTC+3
const BOT = /bot|crawl|spider|preview|headless|facebookexternalhit|slurp|monitor/i;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

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

  await env.EVENTS.put(key, '1', {
    expirationTtl: TTL,
    metadata: {
      t: body.type,
      g: body.type === 'click' ? body.target : undefined,
      c: cf.country || '??',
      ci: cf.city || '',
      d: device,
    },
  });
  return new Response(null, { status: 204 });
}

async function loadEvents(env) {
  const events = [];
  let cursor;
  for (let i = 0; i < PAGES; i++) {
    const page = await env.EVENTS.list({ prefix: 'e:', limit: 1000, cursor });
    for (const k of page.keys) {
      const ts = TS_CEIL - parseInt(k.name.slice(2, 15), 10);
      events.push({ ts, ...(k.metadata || {}) });
    }
    if (page.list_complete) return { events, truncated: false };
    cursor = page.cursor;
  }
  return { events, truncated: true };
}

const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
const top = (map, n) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
const dayOf = (ts) => new Date(ts + TZ_OFFSET).toISOString().slice(0, 10);

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

  const { events, truncated } = await loadEvents(env);

  const totals = { views: 0, scans: 0, clicks: 0 };
  const days = new Map();
  const clicks = new Map();
  const countries = new Map();
  const cities = new Map();
  const devices = new Map();

  const today = Date.now();
  for (let i = 13; i >= 0; i--) {
    days.set(dayOf(today - i * 86400000), { views: 0, scans: 0, clicks: 0 });
  }

  for (const e of events) {
    const bucket = e.t === 'scan' ? 'scans' : e.t === 'click' ? 'clicks' : 'views';
    totals[bucket]++;
    const day = days.get(dayOf(e.ts));
    if (day) day[bucket]++;
    if (e.t === 'click') bump(clicks, e.g || 'other');
    if (e.t !== 'click') {
      bump(countries, e.c || '??');
      if (e.ci) bump(cities, e.ci + (e.c ? ', ' + e.c : ''));
      bump(devices, e.d === 'm' ? 'Mobile' : e.d === 't' ? 'Tablet' : 'Desktop');
    }
  }

  return json({
    totals,
    days: [...days.entries()].map(([date, v]) => ({ date, ...v })),
    clicks: top(clicks, 10),
    countries: top(countries, 10),
    cities: top(cities, 10),
    devices: top(devices, 5),
    recent: events.slice(0, 20),
    sampled: events.length,
    truncated,
  });
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
