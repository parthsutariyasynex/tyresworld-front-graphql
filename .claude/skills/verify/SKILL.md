# Verify — PowerTyre storefront

How to verify changes against the running app.

## Launch

- Dev server: `npm run dev` (port 3000). Check first — the user usually has it running: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
- Backend is live staging Magento: `https://powertire.klever.ae/graphql` (no local backend needed).

## Drive (headless browser)

No Playwright in repo. Use `puppeteer-core` + system Chrome:

```bash
mkdir -p /tmp/verify && cd /tmp/verify && npm i puppeteer-core
# executablePath: /usr/bin/google-chrome, args: ["--no-sandbox"]
```

Key flows / URLs:
- Listing: `/on-road-tires` (client-rendered; wait ~3s after networkidle2)
- PDP: grab first `a[href*="/product/"]` from listing
- Seed a cart via the app's own API from page context, then set localStorage **before** the page you're testing mounts (cart-context hydrates on mount; setting it after shows an empty cart):
  ```js
  await page.evaluate(async () => {
    const r = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "addToNewCart", cartItems: [{ sku: "27311", quantity: 2 }] }) });
    const d = await r.json(); localStorage.setItem("magento_cart_id", d.cart.id);
  });
  await page.reload();  // then navigate to /cart, /checkout
  ```
- Mini-cart: hover `a[href="/cart"][aria-label^="Cart"]` in the header
- Track-order: `/track-order`, fill number/email/lastname. Known-good guest order: `PT-0807262959` / `claude.test@example.com` / `Order`
- SKU `27311` is a known in-stock product (Sunny 175/70 R14, SAR 1,352)

## Gotchas

- Dev-mode first hit on a route compiles it — allow 3-5s or `waitForSelector` on real content, not a fixed sleep.
- Most pages are `"use client"` — `curl` of the HTML won't show prices; you need a browser.
- Account pages need customer login (no known test credentials — ask user).
