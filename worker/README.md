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

One KV entry per event, kept 180 days: event type, button tapped, country, city, device class. No IP addresses, no cookies. Failed password attempts are throttled per hashed client (10 per 15 minutes).

## Notes

- The dashboard reads the latest 5,000 events; a banner shows if there are more.
- KV is eventually consistent, so a new event can take up to about a minute to appear.
- The tracking endpoint is public by nature: anyone who knows the URL can post fake events. Fine for a personal card, not for billing-grade numbers.
