# Gibson Kabugi

**I Ship Production Systems from Nairobi.**

Enterprise ERP across 20 countries by day. AI-enabled products and growth infrastructure the rest of the time.

Most AI engineering happens on fast connections with cheap compute and mature payment rails. Mine does not. That constraint makes the work better.

[gibson.seepu.co.ke](https://gibson.seepu.co.ke) · [LinkedIn](https://www.linkedin.com/in/gibson-kabugi-9b043250/) · [seepu.co.ke](https://seepu.co.ke) · [Digital card](https://gibson.seepu.co.ke/card/) · [Photography](https://kahuna.photos/) · gibson@seepu.co.ke

---

## What I build

**Live, not notebooks · AI in production**
Anthropic Messages API powering a live order assistant with catalog, category, pricing, and checkout tools. Cloudflare Workers running an LLM visitor assistant at the edge. Content and support pipelines on GPT-4 that cut draft time by 70 percent.

**20 countries · Enterprise systems at multi-country scale**
NetSuite ERP, Solver, Journyx, and KProcure administered across a decentralized 20-country environment for an International NGO, employed by Global HQ in New York. Access reviews, segregation of duties, month-end close support, donor compliance. Previously Tier 2 & 3 support for 2,000+ users across 12 African countries at EGPAF. Freshservice and Freshdesk Expert certified through Freshworks University in 2026, with Freshservice running the ITSM day to day.

**4 country offices · Cloud and identity infrastructure**
Microsoft 365, Azure, Intune, Entra ID, OKTA, and Active Directory. SharePoint and Power Automate workflow automation designed, deployed, and supported across four country offices. Backed by completed Microsoft Learn coursework in Azure Administrator and Security, Compliance, and Identity Fundamentals: RBAC, Azure Policy, Entra ID governance, Purview, and Defender XDR.

**40% CPL reduction · Growth engineering**
Technical SEO including Core Web Vitals, crawlability, and site migrations. GEO and AEO for AI-era discoverability. Meta Ads at 5K to 7K USD monthly, cost per lead down 40 percent, conversions up 50 percent.

---

## Selected work

### [Muthoni's Bake House](https://www.muthonibakehouse.co.ke/)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![React 19](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=000000) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Sanity 6](https://img.shields.io/badge/Sanity%206-F03E2F?style=flat-square&logo=sanity&logoColor=white) ![Anthropic SDK](https://img.shields.io/badge/Anthropic%20SDK-D97757?style=flat-square&logo=anthropic&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

Full-stack bakery storefront and content platform for the Kenyan market. Sanity-backed catalog with KES pricing tiers, client-side cart, and an AI order assistant built on the Anthropic Messages API with tool use for catalog lookup, pricing, and order handoff. Split datasets separate public content from private order and subscriber data. Microsoft Graph Mail for notifications, structured Bakery schema, sitemap, and analytics.

> The interesting constraint: card penetration is low and cart abandonment at a payment wall is high, so checkout hands off to WhatsApp where the customer already is. M-Pesa Daraja is on the roadmap. Designing for the payment rails people actually use is the difference between a working store and a portfolio piece.

### [Equitable Homes](https://equitablehomes.co.ke/)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![React 19](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=000000) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS 4](https://img.shields.io/badge/Tailwind%20CSS%204-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Sanity](https://img.shields.io/badge/Sanity-F03E2F?style=flat-square&logo=sanity&logoColor=white) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white) ![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-396CB2?style=flat-square&logo=maplibre&logoColor=white) ![Anthropic API](https://img.shields.io/badge/Anthropic%20API-D97757?style=flat-square&logo=anthropic&logoColor=white)

Marketing and listings site for Equitable Homes Real Estate Limited in Kenya: land, projects with plot-level site plans, homes, rentals, commercial property, vehicles and guides. Content lives in Sanity, with Studio embedded at /studio and draft preview, and the site runs on Cloudflare Workers through OpenNext, with R2 and D1 behind it. Every public form sits behind Turnstile with Resend alerts, and an AI advisor on the Anthropic API answers only from published content and links every page it cites.

> The interesting constraint: the editors are not technical, and the usual paid map layers were off the table. Every routine change has to work in Sanity Studio without a developer, so the optional catalogues (homes, commercial, vehicles, guides) get no header link or sitemap entry until an editor publishes the first document of that kind. Esri's free satellite tier bars revenue-generating apps and Mapbox's terms name real estate as needing a paid licence, so the maps run on self-hosted Protomaps tiles on R2, with no third party in the request path.

### [Joan K. Muthoni — Portfolio](https://joanmuthoni.co.ke/)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![React 19](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=000000) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS 4](https://img.shields.io/badge/Tailwind%20CSS%204-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Upstash Redis](https://img.shields.io/badge/Upstash%20Redis-00E9A3?style=flat-square&logo=upstash&logoColor=000000) ![Resend](https://img.shields.io/badge/Resend-000000?style=flat-square&logo=resend&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

Personal portfolio for Joan K. Muthoni, executive support and customer operations for local and international teams, from Nairobi. A digital business card with save-to-contacts and one-tap call/WhatsApp/email/LinkedIn, a QR flow feeding a private analytics dashboard (QR scans vs direct visits, button taps, device, country and a recent-activity feed, with no IPs stored), and Resend-powered resume requests.

> The interesting constraint: the card's whole job is handing a stranger your phone number and email, but the same one-tap `tel:`/`mailto:` links that make it usable are exactly the shape every plaintext-scraping bot regexes for. Contact details ship as base64 and decode client-side on click, so neither the HTML nor the JS bundles contain them in plain text, and robots.txt shuts crawlers out of the card entirely. Each button also has a server-side redirect fallback so it still works before hydration and inside in-app browsers (Instagram, WhatsApp); that redirect, the vCard and the tracking beacon refuse known bots and cross-site requests. The login (5/min and 20/hr per IP), the beacon and the resume form are rate-limited, a Redis outage degrades to in-memory limits instead of locking anyone out, and `npm audit` reports zero production vulnerabilities.

### [SeePU Solutions](https://seepu.co.ke/)
![Static Site](https://img.shields.io/badge/Static%20Site-4B5563?style=flat-square) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white) ![LLM Assistant](https://img.shields.io/badge/LLM%20Assistant-D97757?style=flat-square&logo=anthropic&logoColor=white)

One partner. Complete ICT and digital growth. Static marketing site engineered for speed on constrained connections, with an AI visitor assistant running as a Cloudflare Worker at the edge. Strategy, execution, and analytics as one operating model rather than three vendors.

### [Digital card and scan analytics](https://gibson.seepu.co.ke/card/)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white) ![Durable Objects](https://img.shields.io/badge/Durable%20Objects-F38020?style=flat-square&logo=cloudflare&logoColor=white) ![Static Site](https://img.shields.io/badge/Static%20Site-4B5563?style=flat-square)

The card behind the QR on my business cards: tap-to-save contact, one-tap call, WhatsApp, email, LinkedIn and GitHub, and a private dashboard with all-time scans, button taps, country, city and device. A Cloudflare Worker feeds a SQLite-backed Durable Object for atomic counters, with a KV event log for the activity feed.

> The interesting constraint: GitHub Pages cannot set response headers and a public tracking endpoint is an open invitation to abuse. So the dashboard uses a signed HttpOnly session cookie instead of a stored password, throttling lives in the Durable Object where it cannot be raced, every page runs a hash-based CSP with no unsafe-inline, and no IP address is ever stored.

### SeePU ContentOS · *In build*
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white) ![Claude Code skills](https://img.shields.io/badge/Claude%20Code%20skills-D97757?style=flat-square&logo=anthropic&logoColor=white) ![Postiz API](https://img.shields.io/badge/Postiz%20API-4B5563?style=flat-square) ![Microsoft 365](https://img.shields.io/badge/Microsoft%20365-0078D4?style=flat-square&logo=microsoftoffice&logoColor=white)

Productized AI content generation and multi-platform publishing. SeePU owns the engine, each client owns their output, and that split is written into every client agreement. A new client onboards by copying a template folder, and the engine is not edited. It holds a voice framework, a prompt library, verified platform constraints, SOPs, a validator and a Postiz scheduling client. Engine v0.1: the pilot client, Muthoni's Bake House, is not yet live.

> The interesting constraint: generated content must never go out under a client's name without their sign-off. The scheduler refuses any batch that lacks a named approver, a timestamp and stored evidence of approval, and a rule file stops the engine being changed during onboarding, so the product claim holds or fails loudly.

### KaziFit · *Concept*
![Next.js 16](https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white) ![Anthropic API](https://img.shields.io/badge/Anthropic%20API-D97757?style=flat-square&logo=anthropic&logoColor=white) ![M-Pesa](https://img.shields.io/badge/M--Pesa-4B5563?style=flat-square)

Application platform for African professionals going for UN, African Union, Africa CDC, INGO and donor roles, priced in KES and paid by M-Pesa. A free, no-signup vacancy check reports what was and was not found about a posting, and the paid layer maps a user's confirmed profile to each requirement before tailoring the CV and cover letter. A specification and a single-file prototype exist; there is no production build and no users yet, and the stack shown is the planned one.

> The interesting constraint: Kenyan job seekers are targeted by recruitment fraud, so the vacancy check never calls a posting or employer safe, legitimate or a scam. It reports the sources checked and what it found and did not find, with no trust score out of 100, and generation draws only on the user's confirmed profile so it cannot invent a credential.

### Live sites I built and maintain

**[globalthrive.africa](https://globalthrive.africa/)** · Global Thrive Africa
Youth mentorship and parenting education initiative in Kenya. I built the platform and I mentor on it, which means every design decision was tested against people actually using it on mobile data.

**[africii.org](https://africii.org/)** · AFRICII
Mission-driven NGO platform with clear program pages, resource sections, and a flexible CMS backend, so the team publishes projects and updates without a developer on call.

---

## Stack

| | |
|---|---|
| **AI** | Anthropic Claude, Messages API, tool use, agentic pipelines, Claude Code, GPT-4 |
| **Web** | Next.js, React, TypeScript, Tailwind, Sanity, Cloudflare Workers, Durable Objects, Workers KV, Upstash Redis, Vercel, GitHub Pages, OpenNext, Cloudflare R2 and D1, MapLibre GL, Turnstile, WordPress, Resend |
| **Enterprise** | NetSuite, Solver, Journyx, KProcure, Unit4, Microsoft 365, Microsoft Graph, Azure, Intune, Freshservice, Freshdesk |
| **Identity** | Entra ID, Azure RBAC, Azure Policy, OKTA, Active Directory |
| **Automation** | Python, PowerShell, ARM templates, REST APIs, Wrangler, Postiz, Power Automate, SharePoint |
| **Data** | Power BI, SuiteAnalytics, GA4, Search Console, Looker, custom first-party analytics (Upstash Redis, Recharts) |
| **Security** | Microsoft Purview, Defender XDR, NIST CSF, CII/CIP, SOPHOS, access reviews, web app hardening (CSP, rate limiting, bot filtering, dependency auditing), security headers, SPF/DKIM/DMARC, CISM in progress |

---

## Certifications

**Oracle NetSuite AI Foundations Associate** · **Oracle NetSuite BI and Reporting Associate** · PMI-CPMAI Introduction · Anthropic AI Fluency and Claude 101 · **Freshservice Expert Certification** · **Freshdesk Expert Certification** · **CCNA v7** · ITIL Foundation · NIST Cybersecurity Framework · Critical Infrastructure Protection (CII/CIP) · Microsoft Azure and M365 Administration · Microsoft Azure Administrator · Microsoft Security, Compliance, and Identity Fundamentals · Microsoft Azure Fundamentals · Google Workspace Admin · PMD Pro · ITU Academy Digital Public Infrastructure · **CISM in progress**

[Full verified list on Credly →](https://credly.com/users/gibson-kabugi)

**Governance** · Completed on Microsoft Learn: **Microsoft Azure Administrator**, **Microsoft Security, Compliance, and Identity Fundamentals**, and **Microsoft Azure Fundamentals**. 60 modules and 15 learning paths across Azure RBAC and Policy, Entra ID identity governance, Microsoft Purview data governance and compliance, and Defender XDR. [Achievements on Microsoft Learn →](https://learn.microsoft.com/en-us/users/gibsonkabugi-8084/achievements)

**ITSM and support** · Completed at Freshworks University, October 2026, each as a full certification path: **Freshservice Expert Certification** and **Freshdesk Expert Certification**. Freshservice is the ITSM platform already in daily use in my current role.

---

## Beyond the code

My documentary photography has been published by the [United Nations](https://news.un.org/sw/story/2024/02/1171737), [WHO](https://iris.who.int/bitstream/handle/10665/342928/9789240031371-eng.pdf?sequence=1&isAllowed=y), and [EGPAF](https://www.pedaids.org/wp-content/uploads/2019/07/2019JUAStoryBooklet.pdf). Same instinct as the engineering work: understand the people before you build the system. Professional portfolio at [kahuna.photos](https://kahuna.photos/).

---

## Reach me

Nairobi · UTC+3

Open to conversations about AI engineering, digital transformation, and enterprise systems roles, particularly where emerging market context is an asset rather than a footnote.

[gibson@seepu.co.ke](mailto:gibson@seepu.co.ke) · [LinkedIn](https://www.linkedin.com/in/gibson-kabugi-9b043250/) · [seepu.co.ke](https://seepu.co.ke) · [Digital card](https://gibson.seepu.co.ke/card/) · [Photography](https://kahuna.photos/) · [+254 726 659 469](tel:+254726659469)
