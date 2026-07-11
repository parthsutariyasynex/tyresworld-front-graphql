/* ─────────────────────────────────────────────────────────────────
   All Magento GraphQL mutations (write operations).
───────────────────────────────────────────────────────────────── */

// ── Shared cart response fragment ────────────────────────────────
// Used wherever the full cart state must be refreshed after a mutation.
const CART_RESPONSE = `
  id
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
`;

// ── Auth Mutations ────────────────────────────────────────────────

export const AUTH_MUTATIONS = {
  register: `mutation Register($firstname: String!, $lastname: String!, $email: String!, $password: String!) {
    createCustomerV2(input: { firstname: $firstname, lastname: $lastname, email: $email, password: $password }) {
      customer { firstname lastname email is_subscribed }
    }
  }`,

  login: `mutation Login($email: String!, $password: String!) {
    generateCustomerToken(email: $email, password: $password) { token }
  }`,

  logout: `mutation Logout { revokeCustomerToken { result } }`,
};

// ── Cart Mutations ────────────────────────────────────────────────

export const CART_MUTATIONS = {

  // 2. createGuestCart — must use sub-selection; bare scalar return is a schema error
  create: `mutation CreateGuestCart { createGuestCart { cart { id } } }`,

  // 3. addProductsToCart — accepts a CartItemInput array so future batch-adds need no schema change
  add: /* GraphQL */ `
    mutation AddProductsToCart($cartId: String!, $cartItems: [CartItemInput!]!) {
      addProductsToCart(cartId: $cartId, cartItems: $cartItems) {
        user_errors { code message }
        cart { ${CART_RESPONSE} }
      }
    }
  `,

  // 4. updateCartItems
  update: `mutation Upd($cartId: String!, $uid: ID!, $qty: Float!) {
    updateCartItems(
      input: {
        cart_id: $cartId
        cart_items: [{ cart_item_uid: $uid, quantity: $qty }]
      }
    ) {
      cart { ${CART_RESPONSE} }
    }
  }`,

  // 5. removeItemFromCart
  remove: `mutation Rem($cartId: String!, $uid: ID!) {
    removeItemFromCart(
      input: {
        cart_id: $cartId
        cart_item_uid: $uid
      }
    ) {
      cart { ${CART_RESPONSE} }
    }
  }`,

  // 6. applyCouponToCart
  applyCoupon: `mutation Cpn($cartId: String!, $code: String!) {
    applyCouponToCart(
      input: {
        cart_id: $cartId
        coupon_code: $code
      }
    ) {
      cart { ${CART_RESPONSE} }
    }
  }`,

  // 7. removeCouponFromCart
  removeCoupon: `mutation RmCpn($cartId: String!) {
    removeCouponFromCart(input: { cart_id: $cartId }) {
      cart { ${CART_RESPONSE} }
    }
  }`,

  // 8. setGuestEmailOnCart
  setEmail: `mutation Em($cartId: String!, $email: String!) {
    setGuestEmailOnCart(input: { cart_id: $cartId, email: $email }) {
      cart { email }
    }
  }`,

  // 9. setShippingAddressesOnCart
  // Returns available_shipping_methods AND available_payment_methods
  // (payment methods are read by checkout after this call)
  setShippingAddress: `mutation Sh($cartId: String!, $addr: CartAddressInput!) {
    setShippingAddressesOnCart(
      input: {
        cart_id: $cartId
        shipping_addresses: [{ address: $addr }]
      }
    ) {
      cart {
        id
        available_payment_methods { code title }
        shipping_addresses {
          available_shipping_methods {
            carrier_code
            method_code
            carrier_title
            method_title
            amount { value currency }
            available
          }
        }
      }
    }
  }`,

  // 10. setShippingMethodsOnCart
  setShippingMethod: `mutation Sm($cartId: String!, $carrier: String!, $method: String!) {
    setShippingMethodsOnCart(
      input: {
        cart_id: $cartId
        shipping_methods: [{ carrier_code: $carrier, method_code: $method }]
      }
    ) {
      cart {
        id
        shipping_addresses {
          selected_shipping_method {
            carrier_code
            method_code
            carrier_title
            amount { value currency }
          }
        }
      }
    }
  }`,

  // 11. setBillingAddressOnCart — billing address passed from checkout form
  setBilling: `mutation Bl($cartId: String!, $addr: CartAddressInput!) {
    setBillingAddressOnCart(
      input: {
        cart_id: $cartId
        billing_address: { address: $addr }
      }
    ) {
      cart { id }
    }
  }`,

  // 12. setPaymentMethodOnCart
  setPayment: `mutation Pm($cartId: String!, $code: String!) {
    setPaymentMethodOnCart(
      input: {
        cart_id: $cartId
        payment_method: { code: $code }
      }
    ) {
      cart {
        selected_payment_method { code title }
      }
    }
  }`,

  // 13. placeOrder
  // PlaceOrderOutput on this store has NO `order` field — only `errors` + `orderV2`
  placeOrder: `mutation Po($cartId: String!) {
    placeOrder(input: { cart_id: $cartId }) {
      errors { code message }
      orderV2 { number }
    }
  }`,

  // 14. mergeCarts — merge a guest cart into the customer cart after login
  mergeCart: `mutation MergeCarts($guestCartId: String!, $customerCartId: String!) {
    mergeCarts(source_cart_id: $guestCartId, destination_cart_id: $customerCartId) { id }
  }`,

  // 15. addProductsToNewCart — atomic create + add in one round-trip (saves an extra createGuestCart call)
  addToNewCart: /* GraphQL */ `
    mutation AddProductsToNewCart($cartItems: [CartItemInput!]!) {
      addProductsToNewCart(cartItems: $cartItems) {
        cart { ${CART_RESPONSE} }
        user_errors { code message }
      }
    }
  `,

  // 16. setCartAsInactive — mark a cart abandoned/inactive (logout / store-switch / pre-redirect)
  // Schema: setCartAsInactive(cartId: String!): SetCartAsInactiveOutput { success error }
  setInactive: /* GraphQL */ `
    mutation SetCartAsInactive($cartId: String!) {
      setCartAsInactive(cartId: $cartId) {
        success
        error
      }
    }
  `,
};

// ── Account Mutations ─────────────────────────────────────────────

export const ACCOUNT_MUTATIONS = {

  // requestPasswordResetEmail — sends reset link to the customer's email
  requestPasswordReset: `mutation RequestPasswordReset($email: String!) {
    requestPasswordResetEmail(email: $email)
  }`,

  // resetPassword — confirms the new password using the token from the email
  resetPassword: `mutation ResetPassword(
    $email: String!
    $resetPasswordToken: String!
    $newPassword: String!
  ) {
    resetPassword(
      email: $email
      resetPasswordToken: $resetPasswordToken
      newPassword: $newPassword
    )
  }`,

  // updateCustomerV2 — update name, subscribed status, etc.
  updateProfile: `mutation UpdateProfile($input: CustomerUpdateInput!) {
    updateCustomerV2(input: $input) {
      customer {
        firstname
        lastname
        email
        is_subscribed
        addresses {
          id firstname lastname street city
          region { region region_code region_id }
          postcode country_code telephone
          default_shipping default_billing
        }
      }
    }
  }`,

  // changeCustomerPassword — change password while logged in
  changePassword: `mutation ChangePassword(
    $currentPassword: String!
    $newPassword: String!
  ) {
    changeCustomerPassword(
      currentPassword: $currentPassword
      newPassword: $newPassword
    ) {
      email
    }
  }`,

  // updateCustomerEmail — change email address (requires current password)
  updateEmail: `mutation UpdateEmail($email: String!, $password: String!) {
    updateCustomerEmail(email: $email, password: $password) {
      customer { email }
    }
  }`,

  // subscribeEmailToNewsletter — subscribe an email to the newsletter
  subscribe: `mutation Subscribe($email: String!) {
    subscribeEmailToNewsletter(email: $email) {
      status
    }
  }`,

  // confirmEmail — verify email address with token from confirmation link
  confirmEmail: `mutation ConfirmEmail($email: String!, $confirmationKey: String!) {
    confirmEmail(input: { email: $email, confirmation_key: $confirmationKey }) {
      customer { email firstname }
      token
    }
  }`,

  // resendConfirmationEmail — resend the email verification link
  resendConfirmationEmail: `mutation ResendConfirmationEmail($email: String!) {
    resendConfirmationEmail(email: $email)
  }`,

  // deleteCustomer — permanently delete the current customer account
  deleteCustomer: `mutation DeleteCustomer {
    deleteCustomer
  }`,
};

// ── Address Mutations ─────────────────────────────────────────────

const ADDRESS_FIELDS = `
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
`;

export const ADDRESS_MUTATIONS = {

  // createCustomerAddress — add a new billing/shipping address
  create: `mutation CreateAddress($input: CustomerAddressInput!) {
    createCustomerAddress(input: $input) { ${ADDRESS_FIELDS} }
  }`,

  // updateCustomerAddress — edit an existing address by ID
  update: `mutation UpdateAddress($id: Int!, $input: CustomerAddressInput!) {
    updateCustomerAddress(id: $id, input: $input) { ${ADDRESS_FIELDS} }
  }`,

  // deleteCustomerAddress — remove an address by ID
  delete: `mutation DeleteAddress($id: Int!) {
    deleteCustomerAddress(id: $id)
  }`,
};

// ── Order Mutations ────────────────────────────────────────────────

export const ORDER_MUTATIONS = {

  // reorderItems — add all products from a past order back to the cart
  reorder: `mutation Reorder($orderNumber: String!) {
    reorderItems(orderNumber: $orderNumber) {
      cart { id }
      userInputErrors { code message path }
    }
  }`,

  // cancelOrder — cancel a customer order (requires order_id + reason)
  cancel: `mutation CancelOrder($orderId: ID!, $reason: String!) {
    cancelOrder(input: { order_id: $orderId, reason: $reason }) {
      error
      order { status }
    }
  }`,

  // requestGuestOrderCancel — guest order cancellation request (step 1)
  requestGuestCancel: `mutation RequestGuestOrderCancel(
    $number: String!
    $reason: String!
  ) {
    requestGuestOrderCancel(input: { number: $number, reason: $reason }) {
      error
      order { status }
    }
  }`,

  // confirmCancelOrder — confirm the cancellation token emailed to the guest (step 2)
  confirmGuestCancel: /* GraphQL */ `
    mutation ConfirmCancelOrder($number: String!, $uid: String!) {
      confirmCancelOrder(input: { number: $number, uid: $uid }) {
        error
        order { status }
      }
    }
  `,

  // createPaymentOrder — create a payment session with the gateway, returns id + redirect info
  // location enum: PRODUCT_DETAIL | MINICART | CART | CHECKOUT | START_OF_CHECKOUT | ADMIN
  createPaymentOrder: /* GraphQL */ `
    mutation CreatePaymentOrder(
      $cartId: String!
      $methodCode: String!
      $paymentSource: String!
      $location: PaymentLocation!
      $vaultIntent: Boolean
    ) {
      createPaymentOrder(input: {
        cartId: $cartId
        methodCode: $methodCode
        paymentSource: $paymentSource
        location: $location
        vaultIntent: $vaultIntent
      }) {
        id
        mp_order_id
        status
        amount
        currency_code
      }
    }
  `,

  // syncPaymentOrder — notify Magento that payment was received (called before completeOrder)
  syncPaymentOrder: /* GraphQL */ `
    mutation SyncPaymentOrder($cartId: String!, $id: String!) {
      syncPaymentOrder(input: { cartId: $cartId, id: $id })
    }
  `,

  // completeOrder — finalize a payment-gateway order after redirect/callback
  // Return type: PlaceOrderOutput { errors, orderV2 }
  // Note: no `order` field on PlaceOrderOutput; grand_total lives under total{}
  completeOrder: /* GraphQL */ `
    mutation CompleteOrder($cartId: String!, $id: String!) {
      completeOrder(input: { cartId: $cartId, id: $id }) {
        errors {
          code
          message
        }
        orderV2 {
          available_actions
          carrier
          email
          id
          is_virtual
          number
          order_date
          order_status_change_date
          shipping_method
          status
          token
          total {
            grand_total { value currency }
          }
        }
      }
    }
  `,
};

// ── Review Mutations ───────────────────────────────────────────────

export const REVIEW_MUTATIONS = {

  // createProductReview — submit a star-rating + text review for a product
  create: `mutation CreateProductReview($input: CreateProductReviewInput!) {
    createProductReview(input: $input) {
      review {
        nickname
        summary
        text
        average_rating
        created_at
        ratings_breakdown { name value }
      }
    }
  }`,
};

// ── Misc Mutations ─────────────────────────────────────────────────

export const MISC_MUTATIONS = {

  // contactUs — send a contact-form message to the store
  contactUs: `mutation ContactUs($input: ContactUsInput!) {
    contactUs(input: $input) {
      status
    }
  }`,

  // estimateShippingMethods — get available shipping methods for a cart + address
  estimateShipping: `mutation EstimateShipping($input: EstimateShippingMethodsInput!) {
    estimateShippingMethods(input: $input) {
      carrier_code
      carrier_title
      method_code
      method_title
      amount { value currency }
      available
      error_message
    }
  }`,

  // estimateTotals — estimate cart totals including tax for a given address
  estimateTotals: `mutation EstimateTotals($cartId: String!, $address: EstimateAddressInput!) {
    estimateTotals(input: { cart_id: $cartId, address: $address }) {
      cart {
        prices {
          grand_total { value currency }
          subtotal_excluding_tax { value currency }
          subtotal_including_tax { value currency }
          applied_taxes { amount { value currency } label }
          discounts { amount { value currency } label }
        }
      }
    }
  }`,
};

// ── Payment Token Mutations/Queries ────────────────────────────────────

export const PAYMENT_TOKEN_MUTATIONS = {

  // deletePaymentToken — remove a saved card by public_hash
  delete: `mutation DeletePaymentToken($publicHash: String!) {
    deletePaymentToken(public_hash: $publicHash) {
      result
      customerPaymentTokens {
        items {
          details
          public_hash
          payment_method_code
          type
        }
      }
    }
  }`,
};

// customerPaymentTokens query (added here alongside mutations for cohesion)
export const CUSTOMER_PAYMENT_TOKENS_QUERY = `
  query CustomerPaymentTokens {
    customerPaymentTokens {
      items {
        details
        public_hash
        payment_method_code
        type
      }
    }
  }
`;

// ── Share / Email ──────────────────────────────────────────────────

export const SHARE_MUTATIONS = {

  // sendEmailToFriend — share a product via email
  sendEmail: `mutation SendEmailToFriend($input: SendEmailToFriendInput!) {
    sendEmailToFriend(input: $input) {
      sender { name email message }
      recipients { name email }
    }
  }`,
};

// ── Compare List Mutations ─────────────────────────────────────────

export const COMPARE_MUTATIONS = {

  // createCompareList — create a new compare list
  create: `mutation CreateCompareList($input: CreateCompareListInput) {
    createCompareList(input: $input) {
      uid
      item_count
      items { uid product { sku name url_key image { url } price_range { minimum_price { final_price { value currency } } } } }
    }
  }`,

  // addProductsToCompareList — add products to an existing compare list
  add: `mutation AddToCompareList($uid: ID!, $products: [ID!]!) {
    addProductsToCompareList(input: { uid: $uid, products: $products }) {
      uid
      item_count
      items { uid product { sku name url_key image { url } price_range { minimum_price { final_price { value currency } } } } }
    }
  }`,

  // removeProductsFromCompareList — remove specific products
  remove: `mutation RemoveFromCompareList($uid: ID!, $products: [ID!]!) {
    removeProductsFromCompareList(input: { uid: $uid, products: $products }) {
      uid
      item_count
      items { uid product { sku name url_key image { url } price_range { minimum_price { final_price { value currency } } } } }
    }
  }`,

  // deleteCompareList — delete the entire compare list
  delete: `mutation DeleteCompareList($uid: ID!) {
    deleteCompareList(input: { uid: $uid }) {
      result
    }
  }`,

  // assignCompareListToCustomer — link guest compare list to logged-in customer
  assign: `mutation AssignCompareList($uid: ID!) {
    assignCompareListToCustomer(uid: $uid) {
      result
      compare_list {
        uid
        item_count
      }
    }
  }`,
};

// ── Wishlist Mutations ─────────────────────────────────────────────

export const WISHLIST_MUTATIONS = {
  add: /* GraphQL */ `
    mutation AddProductsToWishlist($wishlistId: ID!, $wishlistItems: [WishlistItemInput!]!) {
      addProductsToWishlist(wishlistId: $wishlistId, wishlistItems: $wishlistItems) {
        user_errors { code message }
        wishlist {
          id
          items_count
          items_v2 {
            items {
              id
              product { sku }
            }
          }
        }
      }
    }
  `,

  remove: /* GraphQL */ `
    mutation RemoveProductsFromWishlist($wishlistId: ID!, $wishlistItemsIds: [ID!]!) {
      removeProductsFromWishlist(wishlistId: $wishlistId, wishlistItemsIds: $wishlistItemsIds) {
        user_errors { code message }
        wishlist {
          id
          items_count
          items_v2 {
            items {
              id
              product { sku }
            }
          }
        }
      }
    }
  `,

  moveToCart: /* GraphQL */ `
    mutation AddWishlistItemsToCart($wishlistId: ID!, $wishlistItemsIds: [ID!]!) {
      addWishlistItemsToCart(wishlistId: $wishlistId, wishlistItemsIds: $wishlistItemsIds) {
        add_wishlist_items_to_cart_user_errors { code message }
        status
        wishlist {
          id
          items_count
          items_v2 {
            items {
              id
              product { sku }
            }
          }
        }
      }
    }
  `,

  updateItem: /* GraphQL */ `
    mutation UpdateWishlistItem($wishlistId: ID!, $itemId: ID!, $quantity: Float!) {
      updateProductsInWishlist(
        wishlistId: $wishlistId
        wishlistItems: [{ wishlist_item_id: $itemId, quantity: $quantity }]
      ) {
        user_errors { code message }
        wishlist {
          id
          items_count
          items_v2 {
            items {
              id
              quantity
              product { sku name }
            }
          }
        }
      }
    }
  `
};



/* ─────────────────────────────────────────────────────────────────
   Conditional-feature mutations (capability-gated).
   Present in the Magento schema; only callable when the matching
   feature is enabled in Magento Admin. All calls are guarded by
   lib/magento-capabilities.ts — disabled features get a
   "feature unavailable" response instead of a Magento call.
   Shapes verified against the live schema via introspection.
───────────────────────────────────────────────────────────────── */

// ── PayPal ─────────────────────────────────────────────────────────

export const PAYPAL_MUTATIONS = {

  // createPaypalExpressToken — start a PayPal Express / Payflow checkout
  expressToken: /* GraphQL */ `
    mutation CreatePaypalExpressToken(
      $cartId: String!
      $code: String!
      $expressButton: Boolean
      $urls: PaypalExpressUrlsInput!
    ) {
      createPaypalExpressToken(input: {
        cart_id: $cartId
        code: $code
        express_button: $expressButton
        urls: $urls
      }) {
        token
        paypal_urls { start edit }
      }
    }
  `,

  // createPayflowProToken — secure token for Payflow Pro card form
  payflowProToken: /* GraphQL */ `
    mutation CreatePayflowProToken($cartId: String!, $urls: PayflowProUrlInput!) {
      createPayflowProToken(input: { cart_id: $cartId, urls: $urls }) {
        result
        result_code
        response_message
        secure_token
        secure_token_id
      }
    }
  `,

  // handlePayflowProResponse — process the Payflow Pro gateway callback
  handlePayflowPro: /* GraphQL */ `
    mutation HandlePayflowProResponse($cartId: String!, $paypalPayload: String!) {
      handlePayflowProResponse(input: { cart_id: $cartId, paypal_payload: $paypalPayload }) {
        cart { ${CART_RESPONSE} }
      }
    }
  `,
};

// ── Vault (saved-card checkout) ────────────────────────────────────

export const VAULT_MUTATIONS = {

  // createVaultCardSetupToken — begin saving a card (full input passed through)
  createSetupToken: /* GraphQL */ `
    mutation CreateVaultCardSetupToken($input: CreateVaultCardSetupTokenInput!) {
      createVaultCardSetupToken(input: $input) {
        setup_token
      }
    }
  `,

  // createVaultCardPaymentToken — finalize the saved card from a setup token
  createPaymentToken: /* GraphQL */ `
    mutation CreateVaultCardPaymentToken($setupTokenId: String!, $cardDescription: String) {
      createVaultCardPaymentToken(input: {
        setup_token_id: $setupTokenId
        card_description: $cardDescription
      }) {
        vault_token_id
        payment_source { card }
      }
    }
  `,
};

// ── Product-type add-to-cart (bundle / virtual / downloadable) ─────

export const PRODUCT_TYPE_CART_MUTATIONS = {

  // addBundleProductsToCart — bundle products with selected options
  addBundle: /* GraphQL */ `
    mutation AddBundleProductsToCart($cartId: String!, $cartItems: [BundleProductCartItemInput!]!) {
      addBundleProductsToCart(input: { cart_id: $cartId, cart_items: $cartItems }) {
        cart { ${CART_RESPONSE} }
      }
    }
  `,

  // addVirtualProductsToCart — virtual (non-shippable) products
  addVirtual: /* GraphQL */ `
    mutation AddVirtualProductsToCart($cartId: String!, $cartItems: [VirtualProductCartItemInput!]!) {
      addVirtualProductsToCart(input: { cart_id: $cartId, cart_items: $cartItems }) {
        cart { ${CART_RESPONSE} }
      }
    }
  `,

  // addDownloadableProductsToCart — downloadable products with link selection
  addDownloadable: /* GraphQL */ `
    mutation AddDownloadableProductsToCart($cartId: String!, $cartItems: [DownloadableProductCartItemInput!]!) {
      addDownloadableProductsToCart(input: { cart_id: $cartId, cart_items: $cartItems }) {
        cart { ${CART_RESPONSE} }
      }
    }
  `,
};

// ── Deprecated compatibility wrappers ──────────────────────────────
// Magento still exposes these; we keep them callable for backward
// compatibility, but API routes prefer the modern equivalents
// (addProductsToCart / mergeCarts) and only fall back to these.

export const LEGACY_CART_MUTATIONS = {

  // addSimpleProductsToCart — superseded by addProductsToCart
  addSimple: /* GraphQL */ `
    mutation AddSimpleProductsToCart($cartId: String!, $cartItems: [SimpleProductCartItemInput!]!) {
      addSimpleProductsToCart(input: { cart_id: $cartId, cart_items: $cartItems }) {
        cart { ${CART_RESPONSE} }
      }
    }
  `,

  // addConfigurableProductsToCart — superseded by addProductsToCart
  addConfigurable: /* GraphQL */ `
    mutation AddConfigurableProductsToCart($cartId: String!, $cartItems: [ConfigurableProductCartItemInput!]!) {
      addConfigurableProductsToCart(input: { cart_id: $cartId, cart_items: $cartItems }) {
        cart { ${CART_RESPONSE} }
      }
    }
  `,

  // assignCustomerToGuestCart — superseded by mergeCarts
  assignCustomerToGuestCart: /* GraphQL */ `
    mutation AssignCustomerToGuestCart($cartId: String!) {
      assignCustomerToGuestCart(cart_id: $cartId) { ${CART_RESPONSE} }
    }
  `,
};

// ── Admin-only (server-side use only — never expose to the client) ─

export const ADMIN_MUTATIONS = {

  // generateCustomerTokenAsAdmin — impersonate a customer (requires admin bearer)
  generateCustomerTokenAsAdmin: /* GraphQL */ `
    mutation GenerateCustomerTokenAsAdmin($customerEmail: String!) {
      generateCustomerTokenAsAdmin(input: { customer_email: $customerEmail }) {
        customer_token
      }
    }
  `,
};
