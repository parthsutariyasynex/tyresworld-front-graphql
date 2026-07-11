/* ─────────────────────────────────────────────────────────────────
   REUSABLE GRAPHQL FRAGMENTS
   Named fragments on ProductInterface so product field selections are
   defined ONCE and spread into every query, instead of being copy-pasted.
   Append the fragment string to any query document that spreads it.
───────────────────────────────────────────────────────────────── */

/** Minimal fields for product cards / listings (grids, carousels, search). */
export const PRODUCT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProductCardFields on ProductInterface {
    uid
    sku
    name
    stock_status
    url_key
    url_suffix
    brand: mgs_brand
    offers
    image { url label }
    price_range {
      minimum_price {
        final_price { value currency }
      }
    }
  }
`;

/** Full fields for the product detail page (PDP). */
export const PRODUCT_DETAIL_FRAGMENT = /* GraphQL */ `
  fragment ProductDetailFields on ProductInterface {
    uid
    sku
    name
    url_key
    url_suffix
    stock_status
    review_count
    rating_summary
    country_of_manufacture
    brand: mgs_brand
    offers
    description       { html }
    short_description { html }
    image         { url label }
    media_gallery { url label }
    categories { id name url_key }
    price_range {
      minimum_price {
        regular_price { value currency }
        final_price   { value currency }
        discount      { amount_off percent_off }
      }
    }
  }
`;
