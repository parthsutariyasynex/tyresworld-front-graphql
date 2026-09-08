/* ─────────────────────────────────────────────────────────────────
   SPECIAL OFFERS — page copy
   Transcribed verbatim from the live Magento page at
   https://www1.tyresworld.ae/en/special-offers so the headless
   storefront shows the same words as the PHP theme.

   Why this lives here rather than coming from Magento: the CMS page
   body is a single `{{block template="Magento_Theme::pages/
   special-offers.phtml"}}` directive. GraphQL cannot execute a PHP
   template, so `cmsPage.content` returns 164 characters of
   "Error filtering template: Invalid template file…" and nothing
   else. Until that block is replaced with real CMS content in
   Magento Admin, the copy has to live on this side.
───────────────────────────────────────────────────────────────── */

/** Offer banners, mirroring the Mageplaza slider on the live page.
 *  Images are vendored under /public/offers so the storefront never
 *  depends on Magento's versioned media path. */
export const OFFER_BANNERS = [
  {
    id: "matrax-3plus1",
    image: "/offers/buy3-get1-free-matrax-tyres-uae.webp",
    alt: "Buy 3 Matrax tyres and get 1 free in the UAE",
    href: "/tyres?mgs_brand=Matrax&offers=Buy+3+Get+1+Free",
  },
  {
    id: "vredestein-3plus1",
    image: "/offers/buy3-get1-free-vredestein-tyres-uae.webp",
    alt: "Buy 3 Vredestein tyres and get 1 free in the UAE",
    href: "/tyres?mgs_brand=Vredestein&offers=Buy+3+Get+1+Free",
  },
  {
    id: "free-wheel-alignment",
    image: "/offers/free-wheel-alignment-offer-on-tyres-uae_1.webp",
    alt: "Free wheel alignment on a purchase of 4 tyres",
    href: "/tyres?offers=Free+Wheel+Alignment",
  },
  {
    id: "installments",
    image: "/offers/buy-tyres-pay-in-easy-installments-uae.webp",
    alt: "Buy tyres online and pay in easy instalments",
    href: "/tyres",
  },
  {
    id: "2026-tyres",
    image: "/offers/2026-tyres-online-uae_1.webp",
    alt: "2026 tyres fresh from the factory",
    href: "/tyres?year=2026",
  },
  {
    id: "fit-near-you",
    image: "/offers/shop-tyres-fit-near-you-uae_1.webp",
    alt: "Shop tyres online and fit them near you across the UAE",
    href: "/tyres",
  },
] as const;

/** The prose block under the banners. */
export const SEO_INTRO =
  "With so many tyre brands and price points out there, finding a good deal usually means comparing prices across several sites. TyresWorld does that work for you — bringing genuine tyres from major brands together with regular discounts, so you can compare, choose, and buy without the runaround.";

export const SEO_SECTIONS = [
  {
    heading: "Seasonal Discounts & Festival Tyre Deals",
    body: "We run offers tied to the UAE calendar throughout the year — Ramadan and Eid deals, National Day promotions, year-end clearance sales, and summer campaigns — so there's usually a good time to buy waiting just around the corner. Pricing stays transparent throughout: no hidden charges, no surprises at checkout.",
  },
  {
    heading: "Fitting Included, Not an Afterthought",
    body: "Beyond tyre prices themselves, we also run regular discounts on fitting and related services — so a good deal isn't just the tyre, it's the full job done at your doorstep, at a fair price.",
  },
  {
    heading: "Deals Across Cars, Motorbikes, Wheels & Rims",
    body: "Our offers aren't limited to car tyres — you'll also find deals on motorbike tyres, wheels, and rims, with the same mix of seasonal campaigns, bundle discounts, and limited-time promotions on premium brands.",
  },
  {
    heading: "Why Shop Offers at TyresWorld",
    body: "We keep three things consistent across every deal: genuine tyres (never grey-market stock), transparent pricing, and reliable fitting support anywhere in the UAE. Check this page regularly — offers rotate, and the best ones don't last long.",
  },
] as const;

export const FAQS = [
  {
    q: "What kinds of offers does TyresWorld run?",
    a: "A mix — seasonal discounts, buy-3-get-1 deals, free wheel alignment with a set purchase, bundle savings, and interest-free instalment plans through Tabby or Tamara.",
  },
  {
    q: "Where can I see the latest tyre offers in the UAE?",
    a: "Right here — this Special Offers page always shows our current deals in one place. We update it regularly, so it's worth a quick check before you buy.",
  },
  {
    q: "Do offers apply if I only buy fewer than 4 tyres?",
    a: "It depends on the offer — some deals (like free wheel alignment) require a set of 4, while others apply per tyre. The offer terms on each banner will tell you exactly what applies.",
  },
  {
    q: "How long do special offers usually run?",
    a: "Most run for a few weeks, though seasonal campaigns (like Ramadan or National Day) may run longer. Each offer shows its own validity period, so check before you buy.",
  },
  {
    q: "Can I combine a promo code with an existing offer?",
    a: "Usually not — most promo codes can't be stacked on top of an already-discounted offer. If you're unsure, our team can confirm before you check out.",
  },
  {
    q: "How do I know if an offer is still active?",
    a: "Any offer still showing on this page is live. If a deal has ended, it's removed, so what you see here is always current.",
  },
  {
    q: "Can a special-offer tyre be fitted at my home or office?",
    a: "Yes — our mobile fitting network covers most of the UAE, so you can book installation at your home, office, or any location that suits you.",
  },
  {
    q: "Are the tyres in these offers genuine, with a warranty?",
    a: "Yes. Every tyre we sell, discounted or not, is genuine stock from the manufacturer and comes with the standard manufacturer's warranty.",
  },
] as const;
