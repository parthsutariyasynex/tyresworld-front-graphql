/* ─────────────────────────────────────────────────────────────────
   All Magento GraphQL queries (read-only operations).
───────────────────────────────────────────────────────────────── */
import { PRODUCT_CARD_FRAGMENT, PRODUCT_DETAIL_FRAGMENT } from "./graphql/fragments";

// ── Shared field fragments ────────────────────────────────────────

const CUSTOMER_FIELDS = `
  firstname
  lastname
  email
  is_subscribed
  orders(pageSize: 20, currentPage: 1) {
    total_count
    items {
      number
      order_date
      status
      total {
        grand_total      { value currency }
        subtotal         { value currency }
        shipping_handling { total_amount { value currency } }
      }
    }
  }
  addresses {
    id
    firstname
    lastname
    street
    city
    region { region region_code region_id }
    postcode
    country_code
    telephone
    default_shipping
    default_billing
  }
`;

const CART_FIELDS = `
  id
  email
  total_quantity
  applied_coupons { code }
  prices {
    subtotal_excluding_tax { value currency }
    subtotal_including_tax { value currency }
    grand_total { value currency }
    applied_taxes { amount { value currency } label }
    discounts { amount { value currency } label }
  }
  items {
    uid
    quantity
    prices { row_total { value currency } price { value currency } }
    product { name sku url_key thumbnail { url label } }
  }
  available_payment_methods { code title }
  shipping_addresses {
    selected_shipping_method { carrier_code method_code carrier_title amount { value currency } }
    available_shipping_methods {
      carrier_code method_code carrier_title method_title amount { value currency } available
    }
  }
`;

// ── Auth Queries ──────────────────────────────────────────────────

export const AUTH_QUERIES = {
  customer: `query Customer { customer { ${CUSTOMER_FIELDS} } }`,
};

export const CUSTOMER_ORDER_DETAIL_QUERY = /* GraphQL */ `
  query CustomerOrderDetail($number: String!) {
    customer {
      orders(filter: { number: { eq: $number } }) {
        items {
          number
          order_date
          status
          total {
            grand_total      { value currency }
            subtotal         { value currency }
            taxes            { amount { value currency } title rate }
            shipping_handling { total_amount { value currency } }
            discounts        { amount { value currency } label }
          }
          items {
            id
            product_sku
            product_name
            quantity_ordered
            quantity_shipped
            quantity_canceled
            quantity_refunded
            product_sale_price { value currency }
            discounts          { amount { value currency } label }
          }
          shipments {
            id
            number
            tracking { title carrier number }
          }
          shipping_address {
            firstname lastname street city
            region
            postcode country_code telephone
          }
          billing_address {
            firstname lastname street city
            region
            postcode country_code telephone
          }
          payment_methods {
            name type
            additional_data { name value }
          }
          comments {
            timestamp
            message
          }
        }
      }
    }
  }
`;

// ── Cart Queries ──────────────────────────────────────────────────

export const CART_QUERIES = {
  get: `query GetCart($cartId: String!) { cart(cart_id: $cartId) { ${CART_FIELDS} } }`,
  customerCartId: `query CustomerCart { customerCart { id } }`,
};

// ── Product Queries ───────────────────────────────────────────────

export const PRODUCTS_QUERY = /* GraphQL */ `
  query ProductListing(
    $search: String!
    $pageSize: Int!
    $currentPage: Int!
    $categoryUid: String
  ) {
    products(
      search: $search
      pageSize: $pageSize
      currentPage: $currentPage
      filter: { category_uid: { eq: $categoryUid } }
    ) {
      total_count

      page_info {
        current_page
        page_size
        total_pages
      }

      items {
        ...ProductCardFields
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const PRODUCT_DETAIL_QUERY = /* GraphQL */ `
  query ProductDetail($sku: String!) {
    products(filter: { sku: { eq: $sku } }) {
      items {
        ...ProductDetailFields
      }
    }
  }
  ${PRODUCT_DETAIL_FRAGMENT}
`;

export const PRODUCT_DETAIL_BY_URLKEY_QUERY = /* GraphQL */ `
  query ProductDetailByUrlKey($urlKey: String!) {
    products(filter: { url_key: { eq: $urlKey } }) {
      items {
        ...ProductDetailFields
      }
    }
  }
  ${PRODUCT_DETAIL_FRAGMENT}
`;

export const FILTERS_QUERY = /* GraphQL */ `
  query ProductFilters($search: String!) {
    products(
      search: $search
      pageSize: 1
      currentPage: 1
    ) {
      aggregations {
        attribute_code
        label
        count

        options {
          label
          value
          count
        }
      }
    }
  }
`;

// ── Combined Category Page Query (category info + products in one request) ──

// ── Category UID lookup ───────────────────────────────────────────
// `category_url_path` is absent from this Magento's search mapping, so a
// products filter must use `category_uid`. This resolves url key -> uid.
export const CATEGORY_UID_BY_URL_KEY_QUERY = /* GraphQL */ `
  query CategoryUidByUrlKey($urlKey: String!) {
    categories(filters: { url_key: { eq: $urlKey } }) {
      items {
        uid
      }
    }
  }
`;
  
export const CATEGORY_META_BY_URL_KEY_QUERY = /* GraphQL */ `
  query CategoryMetaByUrlKey($urlKey: String!) {
    categories(filters: { url_key: { eq: $urlKey } }) {
      items {
        uid
        name
        url_key
        description
        meta_title
        meta_description
      }
    }
  }
`;

export const CATEGORY_PAGE_QUERY = /* GraphQL */ `
  query CategoryPage(
    $urlKey: String!
    $pageSize: Int!
    $currentPage: Int!
    $sort: ProductAttributeSortInput
    $filters: ProductAttributeFilterInput
    $search: String
  ) {
    categories(filters: { url_key: { eq: $urlKey } }) {
      items {
        uid
        name
        url_key
        description
        meta_title
        meta_description
        category_page_title
      }
    }
    products(
      search: $search
      filter: $filters
      pageSize: $pageSize
      currentPage: $currentPage
      sort: $sort
    ) {
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
      items {
        uid
        sku
        name
        stock_status
        url_key
        url_suffix
        brand: mgs_brand
        offers
        country
        origin
        warranty_period
        image { url label }
        categories { id name url_key }
        small_image { url label }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price   { value currency }
            discount      { amount_off percent_off }
          }
        }
      }
      aggregations {
        attribute_code
        label
        count
        options { label value count }
      }
    }
  }
`;

// ── Category Products by UID (filters by UID, not URL key) ───────

export const CATEGORY_PRODUCTS_BY_UID_QUERY = /* GraphQL */ `
  query CategoryProductsByUid(
    $uid: String!
    $pageSize: Int!
    $currentPage: Int!
    $filters: ProductAttributeFilterInput!
    $sort: ProductAttributeSortInput
  ) {
    categories(filters: { uid: { eq: $uid } }) {
      items {
        uid
        name
        url_key
        description
        meta_title
        meta_description
      }
    }
    products(
      filter: $filters
      pageSize: $pageSize
      currentPage: $currentPage
      sort: $sort
    ) {
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
      items {
        uid
        sku
        name
        stock_status
        url_key
        url_suffix
        brand: mgs_brand
        offers
        country
        origin
        warranty_period
        image { url label }
        categories { id name url_key }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price   { value currency }
          }
        }
      }
    }
  }
`;

// ── Menu / Category Queries ───────────────────────────────────────

export const MENU_QUERY = /* GraphQL */ `
  query Menu {
    categories(filters: { parent_id: { eq: "2" } }, pageSize: 40) {
      items {
        uid
        name
        url_key
        url_path
        include_in_menu
        children {
          uid
          name
          url_key
          url_path
          include_in_menu
          children {
            uid
            name
            url_key
            url_path
            include_in_menu
          }
        }
      }
    }
  }
`;

export const CATEGORY_FILTERS_QUERY = /* GraphQL */ `
  query CategoryFilters($categoryUid: String!) {
    products(
      filter: { category_uid: { eq: $categoryUid } }
      pageSize: 1
      currentPage: 1
    ) {
      aggregations {
        attribute_code
        label
        count
        options {
          label
          value
          count
        }
      }
    }
  }
`;

// ── Offer option metadata: ID → label mapping ────────────────────

export const OFFER_OPTIONS_QUERY = /* GraphQL */ `
  query OfferOptions {
    customAttributeMetadataV2(
      attributes: [{ entity_type: "catalog_product", attribute_code: "offers" }]
    ) {
      items {
        code
        ... on CatalogAttributeMetadata {
          options {
            value
            label
          }
        }
      }
      errors { type message }
    }
  }
`;

// ── Offers aggregation query ──────────────────────────────────────

export const OFFERS_AGGREGATION_QUERY = /* GraphQL */ `
  query OffersAggregation($categoryUid: String!) {
    products(filter: { category_uid: { eq: $categoryUid } }, pageSize: 1, currentPage: 1) {
      aggregations {
        attribute_code
        label
        options {
          label
          value
          count
        }
      }
    }
  }
`;

// ── Tyre Finder: vehicle/model/year/brand metadata (admin-driven, no hardcoding) ─
export const TYRE_FINDER_METADATA_QUERY = /* GraphQL */ `
  query TyreFinderMetadata {
    customAttributeMetadataV2(
      attributes: [
        { entity_type: "catalog_product", attribute_code: "vehicle" }
        { entity_type: "catalog_product", attribute_code: "model" }
        { entity_type: "catalog_product", attribute_code: "year" }
        { entity_type: "catalog_product", attribute_code: "mgs_brand" }
        { entity_type: "catalog_product", attribute_code: "width" }
        { entity_type: "catalog_product", attribute_code: "height" }
        { entity_type: "catalog_product", attribute_code: "rim" }
      ]
    ) {
      items {
        code
        ... on CatalogAttributeMetadata {
          options {
            label
            value
          }
        }
      }
      errors { type message }
    }
  }
`;

/** Resolves the raw numeric "Bike Tyre Type" option (e.g. product.bike_tyre_type
    = 2095) to its real label (e.g. "Scooter / PitBike") — this select
    attribute comes back as an option ID everywhere, PDP included, so the
    PDP specs table needs this the same way brand names are resolved from
    their own raw option ID. */
export const BIKE_TYRE_TYPE_METADATA_QUERY = /* GraphQL */ `
  query BikeTyreTypeMetadata {
    customAttributeMetadataV2(
      attributes: [{ entity_type: "catalog_product", attribute_code: "bike_tyre_type" }]
    ) {
      items {
        code
        ... on CatalogAttributeMetadata {
          options {
            label
            value
          }
        }
      }
    }
  }
`;

// ── Tyre Finder: dependent options via filtered aggregations ──────────
export const TYRE_FINDER_OPTIONS_QUERY = /* GraphQL */ `
  query TyreFinderOptions($filter: ProductAttributeFilterInput!) {
    products(filter: $filter, pageSize: 1, currentPage: 1) {
      aggregations {
        attribute_code
        label
        options {
          label
          value
          count
        }
      }
    }
  }
`;

export const OFFERS_PRODUCTS_QUERY = /* GraphQL */ `
  query OfferProducts(
    $offerValue: String!
    $pageSize: Int!
    $currentPage: Int!
  ) {
    products(
      filter: { offers: { eq: $offerValue } }
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
      items {
        uid
        sku
        name
        stock_status
        url_key
        url_suffix
        brand: mgs_brand
        offers
        country
        origin
        warranty_period
        image { url label }
        categories { id name url_key }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price   { value currency }
          }
        }
      }
    }
  }
`;

// ── Store / Configuration Queries ────────────────────────────────

export const IS_EMAIL_AVAILABLE_QUERY = /* GraphQL */ `
  query IsEmailAvailable($email: String!) {
    isEmailAvailable(email: $email) {
      is_email_available
    }
  }
`;

export const STORE_CONFIG_QUERY = /* GraphQL */ `
  query StoreConfig {
    storeConfig {
      store_code
      store_name
      is_default_store
      locale
      base_currency_code
      default_display_currency_code
      timezone
      copyright
      catalog_default_sort_by
      root_category_uid
    }
  }
`;

// ── DriverReviews (Klever) widget SDK + config ────────────────────
// Boots the DriverReviews JS SDK; per-product data comes via the
// `driver_reviews` field on ProductInterface (see graphql/fragments).
export const KLEVER_DRIVER_REVIEWS_QUERY = /* GraphQL */ `
  query DriverReviewsConfig {
    kleverDriverReviews {
      enabled
      widget_enabled
      sdk_url
      widget_pubkey
      language
      popup_style
      slide_in_popup
      product_widget_type
      review_size
      infinite_scroll
      show_external_reviews
      show_category_rating
      show_jsonld
    }
  }
`;

export const AVAILABLE_STORES_QUERY = /* GraphQL */ `
  query AvailableStores {
    availableStores(useCurrentGroup: true) {
      store_code
      store_name
      locale
      base_currency_code
      default_display_currency_code
      is_default_store
    }
  }
`;

export const CURRENCY_QUERY = /* GraphQL */ `
  query Currency {
    currency {
      base_currency_code
      base_currency_symbol
      default_display_currency_code
      default_display_currency_symbol
      available_currency_codes
      exchange_rates {
        currency_to
        rate
      }
    }
  }
`;

export const COUNTRIES_QUERY = /* GraphQL */ `
  query Countries {
    countries {
      id
      two_letter_abbreviation
      three_letter_abbreviation
      full_name_locale
      full_name_english
      available_regions {
        id
        code
        name
      }
    }
  }
`;

export const COUNTRY_QUERY = /* GraphQL */ `
  query Country($id: String!) {
    country(id: $id) {
      id
      two_letter_abbreviation
      full_name_locale
      full_name_english
      available_regions {
        id
        code
        name
      }
    }
  }
`;

// ── CMS Queries ────────────────────────────────────────────────────

export const CMS_PAGE_QUERY = /* GraphQL */ `
  query CmsPage($identifier: String!) {
    cmsPage(identifier: $identifier) {
      identifier
      title
      content
      content_heading
      meta_title
      meta_description
      meta_keywords
    }
  }
`;

export const CMS_BLOCKS_QUERY = /* GraphQL */ `
  query CmsBlocks($identifiers: [String]!) {
    cmsBlocks(identifiers: $identifiers) {
      items {
        identifier
        title
        content
      }
    }
  }
`;

// ── Checkout Queries ───────────────────────────────────────────────

export const CHECKOUT_AGREEMENTS_QUERY = /* GraphQL */ `
  query CheckoutAgreements {
    checkoutAgreements {
      agreement_id
      checkbox_text
      content
      content_height
      is_html
      mode
      name
    }
  }
`;

// ── Order / Tracking Queries ───────────────────────────────────────

export const GUEST_ORDER_QUERY = /* GraphQL */ `
  query GuestOrder($number: String!, $email: String!, $lastname: String!) {
    guestOrder(input: { number: $number, email: $email, lastname: $lastname }) {
      id
      number
      status
      order_date
      total {
        grand_total      { value currency }
        subtotal         { value currency }
        taxes            { amount { value currency } title rate }
        shipping_handling { total_amount { value currency } }
      }
      items {
        id
        product_sku
        product_name
        quantity_ordered
        quantity_shipped
        quantity_canceled
        product_sale_price { value currency }
        discounts          { amount { value currency } label }
      }
      shipments {
        id
        number
        tracking { title carrier number }
      }
      shipping_address {
        firstname lastname street city
        region
        postcode country_code telephone
      }
      payment_methods {
        name type
        additional_data { name value }
      }
    }
  }
`;

export const GUEST_ORDER_BY_TOKEN_QUERY = /* GraphQL */ `
  query GuestOrderByToken($token: String!) {
    guestOrderByToken(token: $token) {
      id
      number
      status
      order_date
      total {
        grand_total { value currency }
        subtotal    { value currency }
      }
      items {
        id
        product_sku
        product_name
        quantity_ordered
        product_sale_price { value currency }
      }
      shipping_address {
        firstname lastname street city
        region
        postcode country_code
      }
    }
  }
`;

// ── Review Queries ─────────────────────────────────────────────────

export const PRODUCT_REVIEW_RATINGS_METADATA_QUERY = /* GraphQL */ `
  query ProductReviewRatingsMetadata {
    productReviewRatingsMetadata {
      items {
        id
        name
        values {
          value_id
          value
        }
      }
    }
  }
`;

// ── Wishlist Queries ───────────────────────────────────────────────

export const WISHLIST_QUERY = /* GraphQL */ `
  query GetCustomerWishlist {
    customer {
      wishlist_v2 {
        id
        items_count
        items_v2 {
          items {
            id
            quantity
            added_at
            product {
              uid
              sku
              name
              stock_status
              url_key
              url_suffix
              image { url label }
              price_range {
                minimum_price {
                  regular_price { value currency }
                  final_price   { value currency }
                }
              }
              brand: mgs_brand
              rating_summary
              review_count
            }
          }
        }
      }
    }
  }
`;

export const AVAILABLE_STORES_DETAILED_QUERY = /* GraphQL */ `
  query AvailableStoresDetailed {
    availableStores(useCurrentGroup: true) {
      absolute_footer
      allow_guests_to_write_product_reviews
      allow_items
      allow_order
      autocomplete_on_storefront
      base_currency_code
      base_link_url
      base_media_url
      base_static_url
      base_url
      cart_expires_in_days
      cart_summary_display_quantity
      catalog_default_sort_by
      category_fixed_product_tax_display_setting
      category_url_suffix
      check_money_order_enable_for_specific_countries
      check_money_order_enabled
      check_money_order_make_check_payable_to
      check_money_order_max_order_total
      check_money_order_min_order_total
      check_money_order_new_order_status
      check_money_order_payment_from_specific_countries
      check_money_order_send_check_to
      check_money_order_sort_order
      check_money_order_title
      cms_home_page
      cms_no_cookies
      cms_no_route
      code
      configurable_product_image
      configurable_thumbnail_source
      contact_enabled
      copyright
      countries_with_required_region
      create_account_confirmation
      customer_access_token_lifetime
      default_country
      default_description
      default_display_currency_code
      default_keywords
      default_title
      demonotice
      display_product_prices_in_catalog
      display_shipping_prices
      display_state_if_optional
      fixed_product_taxes_apply_tax_to_fpt
      fixed_product_taxes_display_prices_in_emails
      fixed_product_taxes_display_prices_in_product_lists
      fixed_product_taxes_display_prices_in_sales_modules
      fixed_product_taxes_display_prices_on_product_view_page
      fixed_product_taxes_enable
      fixed_product_taxes_include_fpt_in_subtotal
      front
      grid_per_page
      grid_per_page_values
      grouped_product_image
      head_includes
      head_shortcut_icon
      header_logo_src
      id
      is_checkout_agreements_enabled
      is_default_store
      is_default_store_group
      is_guest_checkout_enabled
      is_one_page_checkout_enabled
      list_mode
      list_per_page
      list_per_page_values
      locale
      logo_alt
      logo_height
      logo_width
      magento_wishlist_general_is_enabled
      max_items_in_order_summary
      minicart_display
      minicart_max_items
      minimum_password_length
      newsletter_enabled
      no_route
      optional_zip_countries
      order_cancellation_enabled
      order_cancellation_reasons {
        description
      }
      orders_invoices_credit_memos_display_full_summary
      orders_invoices_credit_memos_display_grandtotal
      orders_invoices_credit_memos_display_price
      orders_invoices_credit_memos_display_shipping_amount
      orders_invoices_credit_memos_display_subtotal
      orders_invoices_credit_memos_display_zero_tax
      payment_payflowpro_cc_vault_active
      product_fixed_product_tax_display_setting
      product_reviews_enabled
      product_url_suffix
      required_character_classes_number
      root_category_id  
      root_category_uid
      sales_fixed_product_tax_display_setting
      secure_base_link_url
      secure_base_media_url
      secure_base_static_url
      secure_base_url
      send_friend {
        enabled_for_customers
        enabled_for_guests
      }
      shopping_cart_display_full_summary
      shopping_cart_display_grand_total
      shopping_cart_display_price
      shopping_cart_display_shipping
      shopping_cart_display_subtotal
      shopping_cart_display_tax_gift_wrapping
      shopping_cart_display_zero_tax
      show_cms_breadcrumbs
      store_code
      store_group_code
      store_group_name
      store_name
      store_sort_order
      timezone
      title_prefix
      title_separator
      title_suffix
      use_store_in_url
      website_code
      website_id   
      website_name 
      weight_unit
      welcome
      zero_subtotal_enable_for_specific_countries
      zero_subtotal_enabled
      zero_subtotal_new_order_status
      zero_subtotal_payment_action
      zero_subtotal_payment_from_specific_countries
      zero_subtotal_sort_order
      zero_subtotal_title
    }
  }
`;

// ── URL Route resolver — resolves a path to product / category / CMS page ──
export const ROUTE_QUERY = /* GraphQL */ `
  query Route($url: String!) {
    route(url: $url) {
      type
      ... on ProductInterface {
        uid
        sku
        url_key
        name
      }
      ... on CategoryInterface {
        uid
        url_key
        name
      }
      ... on CmsPage {
        identifier
        title
      }
    }
  }
`;

// ── Compare list rehydration — restore compare state across page loads ──
export const COMPARE_LIST_QUERY = /* GraphQL */ `
  query CompareList($uid: ID!) {
    compareList(uid: $uid) {
      uid
      item_count
      attributes {
        code
        label
      }
      items {
        uid
        product {
          uid
          sku
          name
          url_key
          url_suffix
          stock_status
          brand: mgs_brand
          image { url label }
          categories { id name url_key }
          price_range {
            minimum_price {
              regular_price { value currency }
              final_price   { value currency }
            }
          }
        }
      }
    }
  }
`;

// ── Bestsellers from MagePlace SMTP extension ──
export const BESTSELLERS_QUERY = /* GraphQL */ `
  query Bestsellers($pageSize: Int, $currentPage: Int) {
    mpSmtpBestsellers(
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      items {
        product_id
        qty_ordered
        product {
          uid
          sku
          name
          url_key
          url_suffix
          stock_status
          brand: mgs_brand
          offers
          image { url label }
          categories { id name url_key }
          price_range {
            minimum_price {
              regular_price { value currency }
              final_price   { value currency }
            }
          }
        }
      }
      page_info {
        total_pages
        current_page
        page_size
      }
    }
  }
`;

// ── Store social URLs (MagePlaza Social Login extension) ──────────
// Real schema: mpSocialUrls { items { social_type url } }
// Note: the resolver has a storeId bug on this instance — API route handles it gracefully.
export const SOCIAL_URLS_QUERY = /* GraphQL */ `
  query SocialUrls {
    mpSocialUrls {
      items {
        social_type
        url
      }
    }
  }
`;

// ── Snowdog Menu module ───────────────────────────────────────────
// Real schema: snowdogMenus { items { menu_id identifier title css_class nodes { items { ... } } } }
export const SNOWDOG_MENUS_QUERY = /* GraphQL */ `
  query SnowdogMenus {
    snowdogMenus {
      items {
        menu_id
        identifier
        title
        css_class
      }
    }
  }
`;

// Real schema: snowdogMenuNodes { items { node_id parent_id type title url_key level position classes } }
// Note: image field requires inline fragment on SnowdogMenuNodeImageFieldInterface — omitted for simplicity.
export const SNOWDOG_MENU_NODES_QUERY = /* GraphQL */ `
  query SnowdogMenuNodes($identifier: String!) {
    snowdogMenuNodes(identifier: $identifier) {
      items {
        node_id
        parent_id
        type
        title
        url_key
        level
        position
        classes
      }
    }
  }
`;

// ── Dynamic address form fields from Magento EAV (attributesForm) ──
export const ATTRIBUTES_FORM_QUERY = /* GraphQL */ `
  query AttributesForm($formCode: String!) {
    attributesForm(formCode: $formCode) {
      items {
        code
        label
        frontend_input
        frontend_class
        default_value
        is_required
        options {
          label
          value
        }
      }
      errors {
        message
      }
    }
  }
`;

// ── View-more for filter aggregations (Magento vendor extension) ──
// Schema verified via introspection: args are filterName/search/filter;
// return type is ViewMoreResult { aggregations: [Aggregation] } — not items/item_count.
export const VIEW_MORE_FILTER_QUERY = /* GraphQL */ `
  query ViewMoreFilter(
    $filterName: String!
    $search: String
    $filter: ProductAttributeFilterInput
  ) {
    viewMoreFilter(
      filterName: $filterName
      search: $search
      filter: $filter
    ) {
      aggregations {
        attribute_code
        label
        count
        has_more
        options {
          label
          value
          count
        }
      }
    }
  }
`;



/* ─────────────────────────────────────────────────────────────────
   Conditional-feature queries (capability-gated).
   These operations exist in the Magento schema but are only
   meaningful when the matching feature is enabled in Magento Admin.
   All calls go through lib/magento-capabilities.ts guards — when a
   feature is disabled the API returns a "feature unavailable"
   response instead of calling Magento.
   Shapes verified against the live schema via introspection.
───────────────────────────────────────────────────────────────── */

// ── reCAPTCHA ──────────────────────────────────────────────────────

// recaptchaV3Config — global v3 config; website_key empty ⇒ disabled
export const RECAPTCHA_V3_CONFIG_QUERY = /* GraphQL */ `
  query RecaptchaV3Config {
    recaptchaV3Config {
      is_enabled
      website_key
      badge_position
      language_code
      minimum_score
      theme
      failure_message
      forms
    }
  }
`;

// recaptchaFormConfig — per-form config (PLACE_ORDER, CONTACT, …)
export const RECAPTCHA_FORM_CONFIG_QUERY = /* GraphQL */ `
  query RecaptchaFormConfig($formType: ReCaptchaFormEnum!) {
    recaptchaFormConfig(formType: $formType) {
      is_enabled
      configurations {
        re_captcha_type
        website_key
        badge_position
        language_code
        minimum_score
        theme
        validation_failure_message
      }
    }
  }
`;

// ── Payment gateway (in-context SDK) ───────────────────────────────

// getPaymentConfig — per-location gateway configuration
export const PAYMENT_CONFIG_QUERY = /* GraphQL */ `
  query GetPaymentConfig($location: PaymentLocation!) {
    getPaymentConfig(location: $location) {
      apple_pay      { code title is_visible payment_source payment_intent sort_order }
      google_pay     { code title is_visible payment_source payment_intent sort_order three_ds_mode }
      hosted_fields  { code title is_visible payment_source payment_intent sort_order three_ds_mode is_vault_enabled requires_card_details }
      smart_buttons  { code title is_visible payment_intent sort_order display_venmo display_message }
    }
  }
`;

// getPaymentSDK — SDK script params for a checkout location
export const PAYMENT_SDK_QUERY = /* GraphQL */ `
  query GetPaymentSDK($location: PaymentLocation!) {
    getPaymentSDK(location: $location) {
      sdkParams { code params { name value } }
    }
  }
`;

// getPaymentOrder — status of a previously created payment order
export const PAYMENT_ORDER_QUERY = /* GraphQL */ `
  query GetPaymentOrder($cartId: String!, $id: String!) {
    getPaymentOrder(cartId: $cartId, id: $id) {
      id
      mp_order_id
      status
    }
  }
`;

// ── Vault (saved-card checkout) ────────────────────────────────────

// getVaultConfig — vault credit-card configuration
export const VAULT_CONFIG_QUERY = /* GraphQL */ `
  query GetVaultConfig {
    getVaultConfig {
      credit_card { is_vault_enabled three_ds_mode }
    }
  }
`;

// ── PayPal ─────────────────────────────────────────────────────────

// getHostedProUrl — iframe URL for PayPal Hosted Pro checkout
export const HOSTED_PRO_URL_QUERY = /* GraphQL */ `
  query GetHostedProUrl($cartId: String!) {
    getHostedProUrl(input: { cart_id: $cartId }) {
      secure_form_url
    }
  }
`;

// getPayflowLinkToken — secure token for PayPal Payflow Link
export const PAYFLOW_LINK_TOKEN_QUERY = /* GraphQL */ `
  query GetPayflowLinkToken($cartId: String!) {
    getPayflowLinkToken(input: { cart_id: $cartId }) {
      mode
      paypal_url
      secure_token
      secure_token_id
    }
  }
`;

// ── Downloadable products (customer library) ───────────────────────

export const CUSTOMER_DOWNLOADABLE_PRODUCTS_QUERY = /* GraphQL */ `
  query CustomerDownloadableProducts {
    customerDownloadableProducts {
      items {
        date
        download_url
        order_increment_id
        remaining_downloads
        status
      }
    }
  }
`;

// ── EAV attribute list (server-side/admin use only) ────────────────

export const ATTRIBUTES_LIST_QUERY = /* GraphQL */ `
  query AttributesList($entityType: AttributeEntityTypeEnum!) {
    attributesList(entityType: $entityType) {
      items {
        code
        label
        frontend_input
        is_required
        is_unique
        default_value
        options { label value }
      }
      errors { type message }
    }
  }
`;

// ── Sitemap queries ───────────────────────────────────────────────

export const SITEMAP_CATEGORIES_QUERY = /* GraphQL */ `
  query SitemapCategories {
    categories(filters: { parent_id: { eq: "2" } }) {
      items { url_path include_in_menu }
    }
  }
`;

export const SITEMAP_PRODUCTS_QUERY = /* GraphQL */ `
  query SitemapProducts($uid: String!, $pageSize: Int!, $currentPage: Int!) {
    products(filter: { category_uid: { eq: $uid } }, pageSize: $pageSize, currentPage: $currentPage) {
      total_count
      items { url_key }
    }
  }
`;

// ── Store locator ──────────────────────────────────────────────────
// Magento's standard MSI "in-store pickup" API (Stores > Inventory >
// Sources, with "Enable Store Pickup" turned on). Branches for the store
// locator come only from this query — see app/api/store-locator/route.ts.
export const PICKUP_LOCATIONS_QUERY = /* GraphQL */ `
  query PickupLocations($pageSize: Int!) {
    pickupLocations(pageSize: $pageSize) {
      total_count
      items {
        pickup_location_code
        name
        city
        street
        region
        phone
        latitude
        longitude
      }
    }
  }
`;

