# Atelier Brodé

A working embroidery-clothing storefront and operations portal built from the Google Stitch designs in
`stitch_bespoke_stitch_studio.zip` (extracted to `_stitch_extract/` for reference; the app itself does not
depend on that folder).

- **Storefront** — premium homepage, shop with live search/filters/sorting, product detail pages, custom
  embroidery studio, persistent cart, checkout, order confirmation/tracking, account history, about and
  contact.
- **Admin portal** (`/admin`) — Clerk sign-in restricted to an email allow-list, live dashboard, product CRUD
  with multi-image upload to Supabase Storage, sizes/colours/stock, categories, orders, custom commission
  queue with private reference artwork, inventory and store settings.
- **Identity** — Clerk owns sign-in and sessions; Supabase stays the database and storage layer and is only
  ever reached from the server with the service-role key once Clerk has identified the caller.
- **Backend** — Supabase Postgres + Storage with Row Level Security, atomic server-side checkout, Razorpay
  payment order creation and server-side HMAC signature verification.

## Design fidelity

The Stitch tokens (Bodoni Moda / Plus Jakarta Sans, calico surfaces, terracotta and wheat accents, spacing
scale, 4 px radii, hairline borders) are ported 1:1 into `tailwind.config.ts`, so components use the original
class vocabulary (`bg-surface`, `text-on-surface-variant`, `px-margin`, `font-display-lg`…). All 51
photographs from the designs were extracted into `public/images/stitch` so nothing depends on expiring
design-tool URLs. The admin console follows the dark ops-sidebar screens.

## Stack

Next.js 15 (App Router, React 19) · TypeScript · Tailwind CSS · Clerk (`@clerk/nextjs`) · Supabase
(`@supabase/ssr`) · Razorpay REST.
The project is Vercel-ready; `next.config.mjs`, `package.json` and npm scripts are standard so existing
GitHub/Vercel settings keep working.

## Setup

1. **Create a Supabase project** and copy the Project URL, anon key and service-role key.
2. **Run the SQL** in the Supabase SQL editor, in order:
   - `supabase/schema.sql` — tables, RLS policies, storage buckets, order/request numbering and the
     `place_order` checkout function.
   - `supabase/seed.sql` — the eight Stitch garments (safe to re-run; existing slugs are left untouched).
3. **Authorise the admin Gmail account** in two places:
   - Replace the placeholder in `schema.sql` (`admin_users`) — or run
     `insert into admin_users (email) values ('you@gmail.com');`
   - Add it to the `ADMIN_EMAILS` environment variable.
4. **Clerk** — the application `app_3MGaDzRbme2Ix8I6gnTkLxEhmhg` provides sign-in. Copy its publishable and
   secret keys from the Clerk dashboard (API keys) into `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
   `CLERK_SECRET_KEY`. Sign-in methods (email code, password, social) are configured in the Clerk dashboard,
   not in this repo. Without the keys the storefront still renders, but the sign-in surfaces show a setup
   notice.
5. **Environment variables** — copy `.env.example` to `.env.local` (locally) or add them in Vercel →
   Settings → Environment Variables. Never commit real keys.

   | Variable | Purpose |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS enforced) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server only: checkout, uploads, admin writes |
   | `ADMIN_EMAILS` | Comma-separated Gmail allow-list |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (browser) |
   | `CLERK_SECRET_KEY` | Clerk secret key (server only) |
   | `NEXT_PUBLIC_SITE_URL` | Canonical origin for links and Razorpay callbacks |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key id used by Checkout.js |
   | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Server-side order creation + signature verification |

6. **Install and run**

   ```bash
   npm install
   npm run dev      # http://localhost:3000
   npm run typecheck
   npm run build
   ```

## Razorpay

Payments stay disabled until `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` exist. When present, checkout
creates the Razorpay order server-side (amount comes from the database order, never from the browser), opens
Checkout.js, and posts the payment response to `/api/payment/razorpay/verify`, which recomputes the
HMAC-SHA256 signature before marking the order paid. Unpaid orders can be retried from the order page. No
payment is ever simulated: without keys the storefront offers pay-on-delivery only.

## Data flow guarantees

- Products are read from Postgres on every request (`force-dynamic`), so admin edits appear without a
  redeploy.
- `place_order()` re-prices every line from `products`, locks rows, validates per-size stock, decrements it
  and writes the order + item snapshots in one transaction.
- Reference images for commissions are stored in the private `custom-references` bucket and served to admins
  through one-hour signed URLs.
- Admin writes use the service-role client only after `requireAdmin()` verifies the signed-in email against
  `ADMIN_EMAILS` / `admin_users`.

## Routes

| Storefront | Admin |
| --- | --- |
| `/` homepage | `/admin` executive overview |
| `/shop`, `/shop/[slug]` | `/admin/products`, `/admin/products/new`, `/admin/products/[id]` |
| `/custom` | `/admin/inventory` |
| `/cart`, `/checkout` | `/admin/orders`, `/admin/orders/[id]` |
| `/orders/[id]`, `/track` | `/admin/requests`, `/admin/requests/[id]` |
| `/account`, `/login` | `/admin/categories`, `/admin/settings` |
| `/about`, `/contact` | `/admin/login`, `/admin/unauthorized` |

## Verification checklist

1. Sign in at `/admin` with the allow-listed email via Clerk → dashboard loads real (empty) metrics.
2. Add a product with photography → it appears in `/shop` immediately.
3. Add to bag, checkout → order appears in `/admin/orders` with stock decremented.
4. Submit a custom brief with reference art in `/custom` → it appears in `/admin/requests`; open it, set
   status and quotation.
5. Approve payment via Razorpay → order payment status becomes `paid` after signature verification.
