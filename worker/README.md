# Card analytics Worker

Counts card views, QR scans and button taps for gibson.seepu.co.ke, and serves the password-protected `/dashboard/`.

## Deploy (one time)

```sh
cd worker
npx wrangler login
npx wrangler kv namespace create EVENTS      # copy the printed id into wrangler.toml
npx wrangler secret put DASH_PASSWORD        # choose the dashboard password
npx wrangler deploy
```

The route `gibson.seepu.co.ke/api/*` requires the `gibson` DNS record to be proxied (orange cloud) in the seepu.co.ke zone. Until the Worker is deployed the card works normally; tracking calls just fail silently.

## What is stored

Every event is kept forever in two places: a KV entry per event (feeds the recent-activity list) and all-time daily counters in a SQLite Durable Object (feeds the totals, chart and rankings, so nothing ever drops out). Each event holds: event type, button tapped, country, city, device class. No IP addresses, no cookies. Failed password attempts are throttled per hashed client (10 per 15 minutes).

## Notes

- Dashboard totals are all-time. The first dashboard load after the counters were introduced imports earlier KV events once.
- KV is eventually consistent, so a new event can take up to about a minute to appear.
- The tracking endpoint is public by nature: anyone who knows the URL can post fake events. Fine for a personal card, not for billing-grade numbers.

## Security model

- **Dashboard login:** the password is checked in the Worker and exchanged for a signed session cookie (`HttpOnly`, `Secure`, `SameSite=Strict`, scoped to `/api`, 1 hour). The browser never stores the password. Rotating `DASH_PASSWORD` invalidates every session.
- **Throttling:** at most 8 failed logins per client per 15 minutes; at most 60 tracked events per client per minute and 600 per minute overall. Limits live in the Durable Object, so they are atomic and cannot be raced.
- **Request checks:** POST only, `Origin` must be the site, bodies over 1 KB are refused, and every response carries `nosniff`, `no-store`, `no-referrer` and a locked-down CSP.
- **Inline-script policy:** pages use hash-based CSPs instead of `'unsafe-inline'`. After editing any inline `<script>` or `<style>`, run `node tools/csp.js` from the repo root to refresh the hashes.
- **Not published:** `_config.yml` keeps `worker/`, `tools/` and this README out of the GitHub Pages output.

## Recommended Cloudflare settings (dashboard, not code)

Rules → Transform Rules → Modify Response Header, for hostname `gibson.seepu.co.ke`, add static headers:

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

(GitHub Pages cannot set response headers itself; `X-Content-Type-Options` and HSTS are already added by Cloudflare.)
