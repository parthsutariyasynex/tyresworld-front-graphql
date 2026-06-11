/* ─────────────────────────────────────────────────────────────────
   Magento GraphQL cart + guest-checkout operations.
   Used server-side by app/api/cart/route.ts.
───────────────────────────────────────────────────────────────── */

// Full cart shape consumed by the cart + checkout UIs.
const CART_FIELDS = `
  id
  email
  total_quantity
  prices {
    subtotal_excluding_tax { value currency }
    grand_total { value currency }
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

export const CART_QUERIES = {
  create: `mutation { createEmptyCart }`,

  get: `query GetCart($cartId: String!) { cart(cart_id: $cartId) { ${CART_FIELDS} } }`,

  add: `mutation Add($cartId: String!, $sku: String!, $qty: Float!) {
    addProductsToCart(cartId: $cartId, cartItems: [{ sku: $sku, quantity: $qty }]) {
      user_errors { code message }
      cart { ${CART_FIELDS} }
    }
  }`,

  update: `mutation Upd($cartId: String!, $uid: ID!, $qty: Float!) {
    updateCartItems(input: { cart_id: $cartId, cart_items: [{ cart_item_uid: $uid, quantity: $qty }] }) {
      cart { ${CART_FIELDS} }
    }
  }`,

  remove: `mutation Rem($cartId: String!, $uid: ID!) {
    removeItemFromCart(input: { cart_id: $cartId, cart_item_uid: $uid }) {
      cart { ${CART_FIELDS} }
    }
  }`,

  applyCoupon: `mutation Cpn($cartId: String!, $code: String!) {
    applyCouponToCart(input: { cart_id: $cartId, coupon_code: $code }) { cart { ${CART_FIELDS} } }
  }`,

  removeCoupon: `mutation RmCpn($cartId: String!) {
    removeCouponFromCart(input: { cart_id: $cartId }) { cart { ${CART_FIELDS} } }
  }`,

  setEmail: `mutation Em($cartId: String!, $email: String!) {
    setGuestEmailOnCart(input: { cart_id: $cartId, email: $email }) { cart { email } }
  }`,

  setShippingAddress: `mutation Sh($cartId: String!, $addr: CartAddressInput!) {
    setShippingAddressesOnCart(input: { cart_id: $cartId, shipping_addresses: [{ address: $addr }] }) {
      cart { ${CART_FIELDS} }
    }
  }`,

  setShippingMethod: `mutation Sm($cartId: String!, $carrier: String!, $method: String!) {
    setShippingMethodsOnCart(input: {
      cart_id: $cartId, shipping_methods: [{ carrier_code: $carrier, method_code: $method }]
    }) { cart { ${CART_FIELDS} } }
  }`,

  setBilling: `mutation Bl($cartId: String!, $addr: CartAddressInput!) {
    setBillingAddressOnCart(input: { cart_id: $cartId, billing_address: { address: $addr } }) {
      cart { id }
    }
  }`,

  setPayment: `mutation Pm($cartId: String!, $code: String!) {
    setPaymentMethodOnCart(input: { cart_id: $cartId, payment_method: { code: $code } }) {
      cart { selected_payment_method { code title } }
    }
  }`,

  placeOrder: `mutation Po($cartId: String!) {
    placeOrder(input: { cart_id: $cartId }) { order { order_number } }
  }`,
};

/* ── Shared types for the normalized server cart ──────────────────── */
export type Money = { value: number; currency: string };

export interface ServerCartItem {
  uid: string;
  quantity: number;
  prices: { row_total: Money; price: Money };
  product: {
    name: string;
    sku: string;
    url_key?: string;
    thumbnail?: { url?: string | null; label?: string | null } | null;
  };
}

export interface ShippingMethodOption {
  carrier_code: string;
  method_code: string;
  carrier_title?: string | null;
  method_title?: string | null;
  amount: Money;
  available: boolean;
}

export interface ServerCart {
  id: string;
  email?: string | null;
  total_quantity: number;
  prices: {
    subtotal_excluding_tax: Money;
    grand_total: Money;
    discounts?: { amount: Money; label: string }[] | null;
  };
  items: ServerCartItem[];
  available_payment_methods?: { code: string; title: string }[];
  shipping_addresses?: {
    selected_shipping_method?: {
      carrier_code: string; method_code: string; carrier_title?: string; amount: Money;
    } | null;
    available_shipping_methods?: ShippingMethodOption[];
  }[];
}
