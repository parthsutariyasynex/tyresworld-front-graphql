# PowerTyre Storefront — Frontend Audit Report

**Date:** 2026-07-09
**Scope:** Complete frontend of the Next.js 15 App Router + Magento 2 GraphQL storefront at `powertire.klever.ae`, verified against the live backend.
**Method:** Five parallel deep-audit passes (catalog, purchase funnel, account/auth, layout/i18n, GraphQL/service layer) with every claim verified by `file:line` inspection, plus live end-to-end tests against the Magento GraphQL backend (guest checkout placed test orders PT-0807262959 / PT-0807266354; schema introspected; capability probes executed live).
**Constraint honored:** No code was modified during this audit.

---

# 1. Executive Summary

## Overall project health: ⚠️ NOT PRODUCTION READY

The **backend-for-frontend layer is in excellent shape**: 99 of 101 Magento GraphQL operations are defined, schema-verified, and routed (only Snowdog menu excluded by decision), with a working dynamic capability layer (`lib/magento-capabilities.ts`) that auto-adapts to Magento Admin changes.

The **frontend consuming that layer is not finished**. The purchase funnel has blocking defects:

1. **Online payments are never collected.** After `placeOrder` with tap/Tamara/Emkan, no gateway redirect happens — the customer sees "ORDER CONFIRMED" without paying. The correct return-flow page (`app/checkout/complete/page.tsx`) exists but nothing navigates to it; `/api/payment` has zero UI callers.
2. **Cash-on-delivery cannot place an order.** The UI sends `cashondelivery`; the store's method is `checkmo` (verified live: Magento rejects with "The requested Payment Method is not available").
3. **The contact form always fails** (field-name mismatch `message` vs `comment`) and still displays fake "MAISON / Paris" template data.
4. **The non-locale product page cannot load products** (queries by `sku` using a `url_key` value).
5. **Forgot/reset password does not exist in the frontend** (dead `href="#"`; no reset landing page).
6. **Every order ships with postcode `"00000"`** — there is no postcode/region input in checkout.

## Scores

| Metric | Value |
|---|---|
| Backend GraphQL coverage (ops defined + routed) | **98%** (99/101; 2 excluded by decision) |
| API routes with live frontend consumers | **~73%** (27 of 37 routes) |
| Frontend feature completion (works end-to-end) | **~70%** |
| Production ready | **No** |
| Fully dynamic (UI adapts to Magento Admin) | **No** (backend yes; UI hardcodes payment methods and never fetches `/api/capabilities`) |

**Bottom line:** browsing, cart, account basics, order tracking, and guest cancellation all work. The store cannot safely take money, be contacted, or recover passwords. Fix the 7 Critical issues in §7 before any launch.

---

# 2. Architecture Overview

## Frontend structure

```
app/                          ← App Router pages (non-locale = EN implementations)
  [locale]/                   ← ar/en routes; mostly thin re-exports of the top-level pages
  api/*/route.ts              ← 37 backend-for-frontend routes (op-switch dispatch)
components/                   ← UI components (layout/, category/, account/, home/, …)
lib/                          ← queries.ts, mutations.ts (all GraphQL), contexts (cart/auth/
                                wishlist/compare), magento.ts (adapters), i18n.ts,
                                magento-capabilities.ts (server), magento-admin.ts (server)
src/config/app-config.ts      ← central config (Magento URL, store views, contact, UIDs)
public/locales/compiled-*.json ← translation dictionaries
```

## API flow

`Component → fetch("/api/<area>") → route handler → gql() → Magento GraphQL`.
No component talks to Magento directly. Route handlers spread grouped GraphQL consts into an op-switch (`const Q = { ...CART_QUERIES, ...CART_MUTATIONS }`) and dispatch on `body.op`.

## GraphQL flow

All operations live in `lib/queries.ts` (52 query consts) and `lib/mutations.ts` (17 groups). Shapes were verified against the live schema via introspection during this audit. Conditional operations (PayPal, vault, reCAPTCHA, product types, admin) are guarded by `lib/magento-capabilities.ts` — schema introspection + live config probes, 5-minute cache.

## Shared state (contexts, mounted in `app/layout.tsx:59-74`)

`AuthProvider → CartProvider → CompareProvider → WishlistProvider`, bridged by `CartAuthSync` (cart merge on login, setInactive on logout). Token stored in `localStorage["customer_token"]`.

## Locale handling

No `middleware.ts`, no `app/[locale]/layout.tsx`. Locale is detected client-side from `usePathname()`; Magento storeview passed as API param (`magentoHeaders(locale)`), matching the project rule (no `/ar/` content duplication). **Exceptions that diverged:** `app/page.tsx` vs `app/[locale]/page.tsx`, and `app/[locale]/product/[urlKey]`, `[locale]/compare`, `[locale]/checkout`, `[locale]/cart` are separate implementations, not re-exports.

## Two parallel catalog implementations (structural risk)

- Non-locale listings use three ~350-line near-identical files: `components/OnRoadPageInner.tsx`, `OffRoadPageInner.tsx`, `EvPageInner.tsx`
- Locale listings use one generic `components/category/CategoryPageInner.tsx`
- They have **diverged**: price sort works only in `CategoryPageInner` (client-side sort at `:176-177`); non-locale inners never sort and `/api/category-page`'s `buildSort()` returns `undefined` for price sorts (`app/api/category-page/route.ts:7-15`). Search `q` forwarding and FilterPanel `urlKey` prop also differ.

---

# 3. Feature Audit

| # | Feature | Status | Key files | GraphQL ops | Verdict / top issue |
|---|---------|--------|-----------|-------------|------------------|
| 1 | Product listing (locale routes) | **PASS** | `components/category/CategoryPageInner.tsx` | CATEGORY_PAGE_QUERY, CATEGORY_FILTERS_QUERY | Loading `:338-341`, error `:342-346`, empty `:347-356` all handled |
| 2 | Product listing (non-locale) | **WARNING** | `components/{OnRoad,OffRoad,Ev}PageInner.tsx` | same | Price sort is a no-op (`OnRoadPageInner.tsx:167-177` + `category-page/route.ts:7-15`); no `q` forwarding; FilterPanel missing `urlKey`; 3× duplicated code |
| 3 | Product detail (locale) | **PASS** | `app/[locale]/product/[urlKey]/page.tsx` | PRODUCT_DETAIL_BY_URLKEY_QUERY | Correct `urlKey=` fetch (`:55`) |
| 4 | Product detail (non-locale) | **FAIL** | `app/product/[urlKey]/page.tsx:45` | PRODUCT_DETAIL_QUERY | Fetches `/api/product?sku=${urlKey}` — filters by SKU with a url_key value; product won't resolve |
| 5 | Search | **PASS** | `components/layout/Header.tsx:279-352`, `/api/products` | PRODUCTS_QUERY | Debounced, min-2-chars, submits `q=` matching CategoryPageInner reader; mobile-drawer search input is dead (`Header.tsx:570-579`) |
| 6 | Filters | **WARNING** | `components/FilterPanel.tsx` | CATEGORY_FILTERS_QUERY, VIEW_MORE_FILTER_QUERY | Solid states; but View-More trigger commented out (`:283-292`) → `/api/view-more-filter` unreachable; UI strings not localized |
| 7 | Tyre finder | **PASS** | `components/TyreFinder.tsx`, `/api/tyre-finder[/options]` | TYRE_FINDER_* + Wheel API | Excellent state handling, AbortController; external GitHub logo dependency (`:36`) |
| 8 | Homepage sections | **PASS** | `components/FastSelling.tsx` | BESTSELLERS_QUERY | Works; TrendingProducts/FeaturedProducts are dead code; homepage content hardcoded in `/api/homepage/route.ts:8-141` |
| 9 | Cart page + context | **PASS** | `app/cart/page.tsx`, `lib/cart-context.tsx` | full CART_MUTATIONS set | Merge-on-login, atomic addToNewCart, stale recovery, OOS cross-check all verified; CTA routes to storelocator not /checkout (`app/cart/page.tsx:328-334`); silent failure on qty update errors (`cart-context.tsx:222-232`) |
| 10 | Mini cart | **WARNING** | `components/layout/Header.tsx:411-520` | via cart context | Subtotal computed with hardcoded `/1.15` VAT back-out (`Header.tsx:109-110`) |
| 11 | Checkout sequence | **PASS** | `app/checkout/page.tsx:271-368` | setEmail→…→placeOrder | Order of ops correct and verified live end-to-end |
| 12 | Payment selection | **FAIL** | `app/checkout/page.tsx:250-268, 851-974` | setPaymentMethodOnCart | Hardcoded radio list ignores `available_payment_methods`; COD maps to invalid `cashondelivery` (backend: `checkmo`); wrong fallbacks `tamara_payin3`/`emkan_payment` (backend: `tamara_pay_by_instalments_4`/`emkan_bnpl`); race before debounced methods fetch |
| 13 | Payment capture / gateway redirect | **FAIL** | `app/checkout/page.tsx:338-361`, `app/api/payment/route.ts`, `app/checkout/complete/page.tsx` | createPaymentOrder etc. | No redirect ever happens; `/api/payment` has 0 UI callers; `/checkout/complete` return-flow page is orphaned; online orders confirm unpaid |
| 14 | Order confirmation | **WARNING** | checkout `:531-573` vs `checkout/complete` | — | Two divergent implementations; only inline one reachable |
| 15 | Checkout data integrity | **FAIL** | `app/checkout/page.tsx:160-171, 81, 86-102` | — | postcode always `"00000"`, region undefined (no inputs exist); vehicle info, order comments, installer selection collected but never sent to Magento |
| 16 | Track order + guest cancel | **PASS** | `app/track-order/page.tsx` | GUEST_ORDER_QUERY, confirmCancelOrder | Lookup + email-link confirmation banners all correct |
| 17 | Login/Register/Logout | **WARNING** | `lib/auth-context.tsx`, `app/account/page.tsx:23-296` | generateCustomerToken, createCustomerV2, revokeCustomerToken | Works; token in localStorage without expiry handling; register auto-login breaks on confirmation-required stores; dead Google button (`:60-73`) |
| 18 | Forgot/Reset password | **FAIL** | `app/account/page.tsx:147` (dead link) | ops ready at `app/api/account/route.ts:79-91` | No UI at all; no reset landing page for the emailed token |
| 19 | Email confirmation | **WARNING** | `app/confirm-email/page.tsx` | confirmEmail, resendConfirmationEmail | Works; discards the session token the API returns (`:28` vs route `:149`) — no auto-login |
| 20 | My Account | **WARNING** | `app/account/page.tsx:317-1133` | updateProfile/changePassword/updateEmail/deleteCustomer | Works; newsletter toggle has no UI; "remote assistance" checkbox non-functional (`:396,987`); delete-account doesn't revoke server token |
| 21 | Orders list/detail + reorder | **WARNING** | `app/account/page.tsx:1135-1511` | CUSTOMER_ORDER_DETAIL_QUERY, reorderItems | Works; error via blocking `alert()` (`:363`); logged-in cancel-order has no UI (op ready) |
| 22 | Address book | **PASS** | `components/account/address.tsx` | attributesForm + ADDRESS_MUTATIONS | Dynamic Magento-driven form, all states handled; can't set new address as default (`:138-139`) |
| 23 | Wishlist | **WARNING** | `lib/wishlist-context.tsx` | WISHLIST_QUERY/MUTATIONS | Optimistic UI w/ rollback; guests blocked consistently; price rendered as `$`+raw value (`app/account/page.tsx:749`) — wrong currency; guest gate uses `alert()` |
| 24 | Compare | **WARNING** | `lib/compare-context.tsx`, `app/[locale]/compare/page.tsx` | COMPARE_* | Guest UID + rehydration work; `assignCompareListToCustomer` never called on login (op ready, unwired) |
| 25 | Saved cards | **WARNING** | ops at `app/api/account/route.ts:165-176` | customerPaymentTokens, deletePaymentToken | API-ready, no UI section in account |
| 26 | Downloadable products | **PASS** | `app/api/account/route.ts:181-188` | customerDownloadableProducts | Capability-gated, dormant by design for a tyre store |
| 27 | Header/Navigation | **WARNING** | `components/layout/Header.tsx` | MENU_QUERY via /api/menu | Categories-based menu (per decision); no fallback nav on menu-fetch failure (`:127-133`) |
| 28 | Footer | **FAIL** | `components/layout/Footer.tsx` | mpSocialUrls via /api/social | 10 brand/shop links point to deleted `/shop` route (`:56-73`); legal links unprefixed → 404 (`:78-83,310-312`); generic social fallbacks; hardcoded contact data; no newsletter form; English-only |
| 29 | Store/Language switcher | **WARNING** | `Header.tsx:35-41`, `LocaleDirectionSetter.tsx` | availableStores (unused) | Pathname swap works; `<html lang="en">` hardcoded (`app/layout.tsx:44`) → RTL flash on /ar SSR |
| 30 | Currency | **WARNING** | `components/Price.tsx`, cart context | CURRENCY_QUERY (unused by UI) | Money component is good; currency comes only from cart fallback chains; `lib/magento.ts:161` falls back to **"AED"** (inconsistent — money bug) |
| 31 | i18n | **WARNING** | `lib/i18n.ts` + compiled dictionaries | — | Category pages use `t()`; Header/Footer/FilterPanel/checkout hardcode strings — shell chrome untranslatable |
| 32 | Contact form | **FAIL** | `app/contact/page.tsx`, `app/api/contact/route.ts:10-22` | contactUs | Sends `message`, API requires `comment` → every submission 400s; page content is fake "MAISON/Paris" template data |
| 33 | Store locator + installer | **PASS** | `app/storelocator/page.tsx`, static JSON | — | Coherent flow into checkout via localStorage; no empty state on load failure |
| 34 | CMS / Reviews / Share | **PASS** | `app/[locale]/[slug]`, `ProductDetailInner.tsx` | CMS_PAGE_QUERY, createProductReview, sendEmailToFriend | All wired; CMS uses unsanitized `dangerouslySetInnerHTML` (`[slug]/page.tsx:118`) |
| 35 | Global error handling | **FAIL** | `app/` (absent files) | — | Zero `error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx` anywhere |

**Tally: 10 PASS · 18 WARNING · 7 FAIL**

---

# 4. Dynamic Capability Audit

The server-side capability layer (`lib/magento-capabilities.ts`) was tested live and works: schema introspection (37 Q / 64 M detected), config probes, 5-min cache, `?refresh=1` bust. **However, no frontend component fetches `/api/capabilities`** — the UI does not yet adapt. Grep confirms the only references to `/api/capabilities` are the route's own comments.

| Feature | Current live status | Detection logic | Backend behavior when disabled | Frontend behavior when disabled | When enabled in Admin |
|---|---|---|---|---|---|
| PayPal | Installed, disabled (`is_visible:false` verified live) | `isPaypalEnabled()` probes `getPaymentConfig` | `/api/payment` returns `{supported:false}` (verified live) | ✅ Nothing shown (but only because ALL payment UI is hardcoded — not because of detection) | Backend ops activate automatically; **UI shows nothing — no PayPal button exists** |
| Vault (saved cards) | Installed, disabled (`is_vault_enabled:false` live) | `isVaultEnabled()` probes `getVaultConfig` | `{supported:false}` (verified live) | No saved-card UI exists | Backend activates; no UI to surface it |
| reCAPTCHA | Installed, disabled (empty `website_key` live) | `isRecaptchaEnabled()` | `/api/recaptcha` → `{enabled:false}` (verified live) | Forms render without captcha ✅ | Backend serves config; **no form fetches `/api/recaptcha`**, so captcha still won't render — needs UI wiring |
| Bundle/Virtual/Downloadable products | Schema supports all; catalog is simple-only | `supportedProductTypes()` from introspection | `/api/cart` addBundle/addVirtual/addDownloadable return featureUnavailable if schema lacks them | Catalog UI renders simple products only; no crash | Cart ops work (addBundle verified live); PDP has no bundle/downloadable option UI |
| Payment methods | `tap, checkmo, tamara_pay_by_instalments_4, emkan_bnpl` (verified live) | `available_payment_methods` is fetched per-cart | — | ❌ **UI ignores it** — four hardcoded radios at `app/checkout/page.tsx:851-974`; `paymentMethods` state only used for substring code-matching | ❌ A newly enabled method never appears; a disabled one still shows a broken button. **This is the biggest dynamic-capability violation.** |
| Store configuration | `/api/store-config` + `/api/store` exist | STORE_CONFIG/AVAILABLE_STORES/CURRENCY queries | — | ❌ No UI consumer; store name/hours/currency are hardcoded in Footer/components | Config changes in Admin have no effect on UI |

**Conclusion:** dynamic behavior is fully implemented at the API layer and absent at the UI layer. The rule "no code changes when Admin config changes" currently holds for API responses but **not** for what customers see.

---

# 5. GraphQL Coverage

All operations are consumed via API routes (backend-for-frontend); no component imports GraphQL directly.

## Fully live (query/mutation → route → UI): 
`AUTH_QUERIES`, `CUSTOMER_ORDER_DETAIL_QUERY`, `CART_QUERIES`, `PRODUCTS_QUERY`, `PRODUCT_DETAIL_QUERY`, `PRODUCT_DETAIL_BY_URLKEY_QUERY`, `CATEGORY_PAGE_QUERY`, `MENU_QUERY`, `CATEGORY_FILTERS_QUERY`, `SEARCH_OPTIONS_QUERY`, `OFFER_OPTIONS_QUERY`, `OFFERS_AGGREGATION_QUERY`, `OFFERS_PRODUCTS_QUERY`, `TYRE_FINDER_METADATA_QUERY`, `TYRE_FINDER_OPTIONS_QUERY`, `IS_EMAIL_AVAILABLE_QUERY`, `COUNTRIES_QUERY`, `COUNTRY_QUERY`, `CMS_PAGE_QUERY`, `CMS_BLOCKS_QUERY`, `CHECKOUT_AGREEMENTS_QUERY`, `GUEST_ORDER_QUERY`, `GUEST_ORDER_BY_TOKEN_QUERY`, `PRODUCT_REVIEW_RATINGS_METADATA_QUERY`, `WISHLIST_QUERY`, `COMPARE_LIST_QUERY`, `BESTSELLERS_QUERY`, `SOCIAL_URLS_QUERY`, `ATTRIBUTES_FORM_QUERY`, `CUSTOMER_DOWNLOADABLE_PRODUCTS_QUERY`, and mutation groups `AUTH_`, `CART_`, `ACCOUNT_`, `ADDRESS_`, `ORDER_`, `REVIEW_`, `MISC_`, `PAYMENT_TOKEN_`, `SHARE_`, `COMPARE_`, `WISHLIST_`, `PRODUCT_TYPE_CART_`, `LEGACY_CART_MUTATIONS`.

## Routed but no UI caller (dormant/conditional or orphaned):

| Operation | Route | Note |
|---|---|---|
| PAYMENT_CONFIG/SDK/ORDER, VAULT_CONFIG, HOSTED_PRO_URL, PAYFLOW_LINK_TOKEN, `PAYPAL_MUTATIONS`, `VAULT_MUTATIONS` | `/api/payment` | Conditional by design, but ALSO the whole route has 0 UI callers — checkout's gateway flow is unbuilt |
| RECAPTCHA_V3/FORM_CONFIG | `/api/recaptcha` + capabilities | Probe used by capability layer; no form fetches the route |
| VIEW_MORE_FILTER_QUERY | `/api/view-more-filter` | Only caller is the commented-out View-More modal |
| ROUTE_QUERY | `/api/resolve-url` | `[slug]` resolver probes category-page + cms instead |
| FILTERS_QUERY | `/api/filters` | Superseded by `/api/category-filters` |
| CATEGORY_PRODUCTS_BY_UID_QUERY, CATEGORY_PRODUCT_SIZES_QUERY | `/api/category-products`, `/api/category-sizes` | Orphaned routes |
| SNOWDOG_MENUS/MENU_NODES | `/api/snowdog-menu` | Excluded by decision — route itself should be deleted |
| STORE_CONFIG/AVAILABLE_STORES/CURRENCY | `/api/store-config`, `/api/store` | Server-to-server only; no UI consumer |
| ATTRIBUTES_LIST_QUERY, `ADMIN_MUTATIONS` | `lib/magento-admin.ts` | Server-only, dormant by design (0 importers, correctly unexposed) |

## Dead GraphQL (zero consumers anywhere):
- `AVAILABLE_STORES_DETAILED_QUERY` (`lib/queries.ts:840`) — delete candidate.

---

# 6. Hardcoded Logic Audit

| File:line | Value | Severity | Recommended fix |
|---|---|---|---|
| `src/config/app-config.ts:29` | Wheel API `userKey` secret committed as fallback | **Critical** | Remove literal; require `WHEEL_USER_KEY` env; rotate the key |
| `app/checkout/page.tsx:62, 250-268, 851-974` | Payment methods + codes (`tap`, `cashondelivery`, `tamara_payin3`, `emkan_payment`) | **Critical** | Render options from `available_payment_methods` (already in CART_FIELDS); drop substring mapping |
| `lib/magento.ts:161` | Currency fallback `"AED"` (rest of app uses SAR) | **High** | Single store-currency source from store-config |
| `app/[locale]/compare/page.tsx:259`, `components/ProductCard.tsx:93`, `TyreCard.tsx:136` | Placeholder WhatsApp `wa.me/966500000000` in buy CTAs | **High** | Use `APP_CONFIG.contact.whatsapp` (real number) |
| `app/api/homepage/route.ts:8-141` | Entire homepage content (hero, categories, CTAs) authored in code | **High** | Move to Magento CMS blocks |
| `app/checkout/page.tsx:1067-1068` | Delivery Charges always `0` | **High** | Show `selected_shipping_method.amount` |
| `app/checkout/page.tsx:1085`, `app/cart/page.tsx:315`, `app/account/page.tsx:1338`, `ProductDetailInner.tsx:810` | "VAT (15%)" label | **High** | Render from `applied_taxes` (already queried) |
| `components/layout/Header.tsx:109-110` | Mini-cart subtotal = total ÷ 1.15 | **High** | Use `prices.subtotal_excluding_tax` |
| `app/checkout/page.tsx:160-171` | buildAddress fake defaults (postcode "00000", phone "0500000000", "Guest User") | **High** | Add postcode/region inputs; validate instead of substituting |
| `components/FeaturedProducts.tsx:17-22`, `app/api/category-sizes/route.ts:27`, Footer/BrandStrip/etc. (15+ sites) | Category UIDs `MTg=`, `Mg==`, `MTExNg==`… | **Medium** | Single config constant / fetch from menu API |
| `components/layout/Footer.tsx:149-324` | Phone `920017534`, email, address, hours, cert URL, copyright `2026`, 8 absolute `klever.ae` image URLs | **Medium** | Drive from store-config; relative assets |
| `lib/brandLogos.ts:10-51` | 40+ brand logo URLs on staging domain | **Medium** | Use backend `brand_logo_url` |
| `app/account/page.tsx:749` | Wishlist price `$`+raw value | **Medium** | Use `<Money>` |
| `app/account/page.tsx:793,1246,1333,1383,1413`, `components/account/address.tsx:86` | SAR/"Saudi Arabia"/shipping/payment label fallbacks | **Low** | Centralize |
| `src/config/app-config.ts:16` | Staging domain `powertire.klever.ae` as brand domain | **Low** | Env-driven |
| `components/TyreFinder.tsx:36` | Vehicle logos from `raw.githubusercontent.com` | **Low** | Self-host |
| `components/layout/Footer.tsx:87-92` | Social fallback URLs (generic facebook.com/instagram.com) | **Low** (documented fallback) | Replace with real profile URLs |
| `components/ProductImage.tsx:30`, `lib/magento.ts:136` | Image placeholders | **Acceptable** | Keep (documented) |

---

# 7. Issues

## Critical (block launch)

| # | Issue | Location | Fix |
|---|---|---|---|
| C1 | Online payments never captured — no gateway redirect; orders confirm unpaid | `app/checkout/page.tsx:338-361`; dead `app/api/payment/route.ts`; orphaned `app/checkout/complete/page.tsx` | After placeOrder for online methods: `createPaymentOrder` → redirect to gateway → return to `/checkout/complete` (page already built) |
| C2 | COD checkout fails — sends `cashondelivery`, store method is `checkmo` (verified live) | `app/checkout/page.tsx:255-257` | Map by title too, or render codes directly from `available_payment_methods` |
| C3 | Contact form 100% broken — `message` vs `comment` mismatch → always HTTP 400 | `app/contact/page.tsx` (handleSubmit) vs `app/api/contact/route.ts:10-22` | Send `comment`; also replace fake "MAISON/Paris" page content |
| C4 | Non-locale product page can't load products — queries by `sku` with url_key value | `app/product/[urlKey]/page.tsx:45` | Use `?urlKey=` like the locale variant (`app/[locale]/product/[urlKey]/page.tsx:55`) |
| C5 | Forgot/reset password missing entirely (dead `href="#"`, no token landing page) | `app/account/page.tsx:147`; ops ready `app/api/account/route.ts:79-91` | Build forgot form + `/reset-password` page reading `email`+`token` params |
| C6 | Every order ships postcode `"00000"`, region undefined — no inputs exist | `app/checkout/page.tsx:166,169` (buildAddress), `EMPTY_FORM:50` | Add postcode + region fields, validate |
| C7 | Committed API secret (Wheel API userKey) | `src/config/app-config.ts:29` | Remove from source, rotate key, require env |

## High

| # | Issue | Location | Fix |
|---|---|---|---|
| H1 | Payment options hardcoded; wrong fallback codes (`tamara_payin3`, `emkan_payment`); race before debounced methods fetch | `app/checkout/page.tsx:250-268, 851-974` | Render from `available_payment_methods`; block submit until methods loaded |
| H2 | Checkout data loss: vehicle plate/make/model/year, order comments, installer selection never sent to Magento | `app/checkout/page.tsx:81, 86-102, 271-368` | Attach as order attributes/comment; map installer to the real shipping method |
| H3 | Footer: 10 links to deleted `/shop`; 9 unprefixed legal/CMS links that 404 | `components/layout/Footer.tsx:56-83, 310-312` | Point brand links at live category routes; prefix CMS links with locale |
| H4 | No error boundaries: zero `error.tsx`/`global-error.tsx`/`not-found.tsx`/`loading.tsx` | `app/` | Add global-error, not-found, and per-segment error/loading files |
| H5 | Currency fallback "AED" contradicts SAR everywhere else | `lib/magento.ts:161` | Align to store currency |
| H6 | Mid-session token expiry unhandled — stale customer state, silent failures | `lib/auth-context.tsx:23-36`, `lib/wishlist-context.tsx:62-66` | Detect auth errors centrally → clear token, prompt re-login |
| H7 | RTL/lang set client-side only — `/ar` pages SSR as `lang=en dir=ltr` (flash) | `app/layout.tsx:44`, `LocaleDirectionSetter.tsx` | Add `app/[locale]/layout.tsx` or middleware to set lang/dir server-side |
| H8 | Cart "PROCEED TO CHECKOUT" goes to storelocator, not /checkout | `app/cart/page.tsx:328-334` | Confirm intended funnel; if intended, label it accordingly |
| H9 | `[locale]` checkout/cart implementations diverged from the audited non-locale ones | `app/[locale]/checkout/page.tsx`, `app/[locale]/cart/page.tsx` | Unify to single implementation (re-export) |

## Medium

| # | Issue | Location |
|---|---|---|
| M1 | Price sort no-op on non-locale listings | `components/{OnRoad,OffRoad,Ev}PageInner.tsx:167-177`, `app/api/category-page/route.ts:7-15` |
| M2 | Compare list never assigned to customer on login (`assign` op unwired) | `lib/compare-context.tsx`; `app/api/compare/route.ts:69-73` |
| M3 | Frontend never consumes `/api/capabilities` or `/api/recaptcha` — UI cannot adapt to Admin changes | grep-verified zero callers |
| M4 | View-More filter feature disabled (trigger commented out) → endpoint unreachable | `components/FilterPanel.tsx:283-292` |
| M5 | Mobile drawer search input dead (no handlers) | `components/layout/Header.tsx:570-579` |
| M6 | Related-products link hardcodes `/en/run-flat-tires` + `search=` vs `q=` param mismatch drops the term; breadcrumb always run-flat | `components/ProductDetailInner.tsx:551, 672, 526` |
| M7 | Wishlist price `$`+raw value; guest gate via `alert()` | `app/account/page.tsx:749`; `components/ProductCard.tsx:81` |
| M8 | Header nav renders nothing if menu fetch fails (no fallback) | `components/layout/Header.tsx:127-133` |
| M9 | confirmEmail discards returned session token (no auto-login) | `app/confirm-email/page.tsx:28` |
| M10 | Silent cart update failures (qty/remove errors not surfaced) | `lib/cart-context.tsx:222-232` |
| M11 | Newsletter subscribe, saved cards, logged-in order cancel: ops ready, no UI | `app/api/account/route.ts:120-124, 165-176`; `app/api/orders/route.ts:81-89` |
| M12 | Unsanitized `dangerouslySetInnerHTML` for CMS/category/agreement HTML | `app/[locale]/[slug]/page.tsx:118`, `components/CategorySeoSection.tsx:32`, `app/checkout/page.tsx:1164` |
| M13 | i18n inconsistent — Header/Footer/FilterPanel/checkout bypass `t()` | multiple |
| M14 | `gql()` helper duplicated in 11 files; `Gql` type re-declared everywhere; `err` helper ×8 | see §9 |

## Low

- Blocking `alert()` for errors: `app/account/page.tsx:363, 387`, `ProductCard.tsx:81`
- `console.log` leaking cartId: `app/api/cart/route.ts:221`; 37 more console.* diagnostics unguarded
- Non-functional Google sign-in button (`app/account/page.tsx:60-73`) and "remote assistance" checkbox (`:396,987`)
- Address form can't set new default shipping/billing (`components/account/address.tsx:138-139`)
- `any` usage: 10× in `lib/wishlist-context.tsx`, plus account/cart/category-products routes; 24 eslint-disables (mostly `no-img-element`)
- Store-locator date labels forced `en-US` (`app/storelocator/page.tsx:14-15`)
- `/api/products` default search term `"tyre"` (`app/api/products/route.ts:9`)

---

# 8. Missing Features (vs Magento GraphQL capabilities)

1. **Payment gateway UI flow** — createPaymentOrder/sync/complete + redirect (API fully ready, incl. `/checkout/complete` page)
2. **Forgot/reset password pages** (ops ready)
3. **reCAPTCHA form integration** (config route ready; needed the moment Admin enables it)
4. **Saved-cards section in account** (`customerPaymentTokens` ready)
5. **Newsletter subscribe UI** (op ready; footer form was deleted)
6. **Logged-in order cancellation UI** (`cancelOrder` ready)
7. **Compare list assignment on login** (`assignCompareListToCustomer` ready)
8. **Store-config-driven UI** (store name/hours/currency/social all hardcoded while queries exist)
9. **Capability-driven UI adaptation** (`/api/capabilities` unconsumed)
10. **Postcode/region checkout fields** (Magento address schema supports them; UI omits them)

---

# 9. Cleanup Opportunities

## Dead components (zero importers, grep-verified)
`components/Navbar.tsx`, `components/Footer.tsx` (root — `layout/Footer.tsx` is live), `components/Hero.tsx`, `components/FeaturedProducts.tsx`, `components/home/TrendingProducts.tsx`, `components/CmsInfoSection.tsx`, `components/TrustBar.tsx`, `components/TyreCard.tsx`, `components/TyreCardSkeleton.tsx`, `components/TyreSearch.tsx`, `components/SearchBar/index.tsx`, `components/RunFlatPageInner.tsx`, `components/tyre/FilterSidebar.tsx`, `components/tyre/SortDropdown.tsx`; transitively dead: `components/ProductCard.tsx`, `components/ProductCardSkeleton.tsx` (only imported by dead files).

## Dead lib code
`lib/useOffers.ts` (0 importers; distinct from used `useOfferLabels.ts`), `lib/data.ts` `categories[]` mock array (`:96-129` — keep the types), `AVAILABLE_STORES_DETAILED_QUERY` (`lib/queries.ts:840`).

## Orphaned API routes (no UI caller)
`/api/filters`, `/api/resolve-url`, `/api/category-products`, `/api/category-by-urlkey` (self-labeled deprecated), `/api/category-sizes`, `/api/snowdog-menu` (decision: delete), `/api/vehicles` (superseded), `/api/view-more-filter` (blocked by commented-out UI), `/api/store-config` (server-to-server only). *(`/api/payment`, `/api/recaptcha`, `/api/capabilities` are intentionally dormant — keep.)*

## Duplication to consolidate
- `gql()` helper ×11 files + ~26 inline fetch variants → one shared `magentoGql()`
- `Gql` type re-declared per route → shared type
- `err()` helper ×8 → shared
- 3× listing inners (`OnRoad/OffRoad/EvPageInner`) → parameterized `CategoryPageInner`
- Two homepage implementations; diverged `[locale]` checkout/cart; two order-confirmation screens
- `Footer.tsx` dead `EXPLORE_TIRES` const (`:49-54`) superseded by local `exploreTires`

---

# 10. Final Verification

| Check | Result |
|---|---|
| **Production Ready** | **No** — 7 critical issues (payments not captured, COD broken, contact broken, non-locale PDP broken, no password reset, postcode integrity, committed secret) |
| **Fully Dynamic** | **No** — API layer yes (verified live); UI hardcodes payment methods, never consumes `/api/capabilities`, `/api/recaptcha`, or store-config |
| **Magento Admin Compatible** | **Partially** — backend adapts automatically (verified: capability probes, feature-unavailable guards); customer-facing UI does not |
| **GraphQL Coverage** | **98%** of schema operations defined + routed (99/101, Snowdog excluded by decision); 100% of shapes schema-verified |
| **Frontend Coverage** | **~70%** — 10/35 features PASS, 18 WARNING, 7 FAIL; ~73% of API routes have live UI consumers |

## Recommended fix order
1. **C1 + C2 + H1** — make the checkout actually collect money (gateway redirect + dynamic payment methods). Everything else is secondary to this.
2. **C3, C4, C5, C6** — contact form, non-locale PDP, password reset, postcode fields.
3. **C7** — rotate + remove the committed Wheel API key.
4. **H3–H9** — footer links, error boundaries, currency/token/RTL/funnel issues.
5. Consolidate the duplicated catalog implementations, then run the cleanup list (§9).

---

*Every finding in this report cites exact file:line locations verified during the audit. Live-backend verifications (payment codes, placeOrder behavior, capability probes, schema shapes) were executed against `https://powertire.klever.ae/graphql` on 2026-07-08/09.*
