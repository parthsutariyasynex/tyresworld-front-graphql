# Ecommerce Homepage — Tyre Store on Magento GraphQL

A Next.js storefront for a tyre/automotive shop. All catalog, navigation, cart,
and checkout data comes from a **Magento 2 GraphQL** backend through server-side
API proxy routes — there is no hardcoded product data.

Live demo backend: `https://demo2.tyrescart.ae/graphql`

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS**
- **Magento 2 GraphQL** as the data source
- `swiper` (hero slider), `lucide-react` (icons)

## Features

- **Homepage** — hero slider, category strip (from the live category tree),
  featured & trending products fetched from GraphQL.
- **Header / footer menus** — built from the Magento category tree via `/api/menu`
  (no hardcoded categories).
- **Shop page** — product grid with:
  - Filters from Magento `aggregations` (brand, width, rim, origin, …) — dynamic, API-driven.
  - Sorting (Featured / Best Match) and pagination.
  - Filter/sort/page state persisted in the URL query string.
- **Cart** — real **Magento server cart** (create / add / update / remove / coupons),
  persisted by cart id in `localStorage`.
- **Guest checkout** — address → live shipping methods → payment method →
  `placeOrder`, with an order-confirmation screen.
- **Resilient product images** — bypass the Next.js optimizer for external Magento
  media and fall back to a local placeholder on error.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure the backend (see below)
cp .env.local.example .env.local   # or create .env.local manually

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000.

## Environment variables

Create a `.env.local` file in the project root:

```bash
# Magento GraphQL endpoint (required)
MAGENTO_GRAPHQL_URL=https://demo2.tyrescart.ae/graphql

# Bearer token — only if the endpoint requires auth (leave blank for public/guest)
MAGENTO_API_TOKEN=

# Optional: default category uid for the homepage "All" view
# (base64 of the Magento category id; "MTg=" = Tyres, "Mg==" = store root)
# MAGENTO_DEFAULT_CATEGORY_UID=MTg=
```

> `.env.local` is git-ignored — keep endpoints/tokens out of version control.

## API proxy routes

The browser never calls Magento directly; these server routes proxy GraphQL
(keeping the endpoint/token server-side):

| Route | Purpose |
|-------|---------|
| `GET /api/products` | Products + `aggregations` (filters) + paging. Accepts `categoryUid`, `search`, `sort`, `page`, `pageSize`, and any attribute filter (e.g. `mgs_brand=Accelera`). |
| `GET /api/menu` | Category tree for header/footer navigation. |
| `POST /api/cart` | All cart + checkout operations (`create`, `add`, `update`, `remove`, coupons, `setShippingAddress`, `setShippingMethod`, `setPayment`, `placeOrder`, …). |

## Project structure

```
app/
  api/{products,menu,cart}/route.ts   # GraphQL proxy routes
  shop/page.tsx                       # listing + filters/sort/pagination
  cart/page.tsx                       # server cart
  checkout/page.tsx                   # guest checkout
  layout.tsx                          # CartProvider + header/footer
components/
  layout/{Header,Footer}.tsx          # API-driven nav
  shop/{FilterSidebar,SortDropdown,Pagination}.tsx
  ProductCard.tsx, ProductImage.tsx, ...
lib/
  magento.ts        # products/menu queries + adapters
  cart-queries.ts   # cart + checkout GraphQL ops
  cart-context.tsx  # client cart state (server cart + localStorage)
  data.ts           # shared types
```

## Checkout note

For a fully testable order without a payment-gateway redirect, use the
**Check / Money order** (`checkmo`) payment method — `placeOrder` completes it
directly and returns an order number. Card/Tabby/Tamara require a hosted
redirect not implemented here.

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint
```

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/parthsutariyasynex/ecommerce-homepage-demo)

1. Push to GitHub, then on [vercel.com](https://vercel.com) → **Add New… → Project**
   and import this repository. Next.js is auto-detected (no build config needed).
2. Add the **environment variables** (Settings → Environment Variables) — these are
   required because `.env.local` is not committed:

   | Key | Value |
   |-----|-------|
   | `MAGENTO_GRAPHQL_URL` | `https://demo2.tyrescart.ae/graphql` |
   | `MAGENTO_API_TOKEN` | *(leave empty for guest/public)* |

3. Click **Deploy**. Every subsequent `git push` to `main` auto-deploys to
   production; other branches get preview URLs.

> The `/api/*` routes run as serverless functions and fetch the Magento GraphQL
> API server-side — cart and guest checkout work the same as locally.

## License

[MIT](./LICENSE) © Parth Sutariya
