/* ─────────────────────────────────────────────────────────────────
   Shared TypeScript types for Magento GraphQL responses.
───────────────────────────────────────────────────────────────── */

/* ── Auth / Customer types ─────────────────────────────────────── */

export interface CustomerOrder {
  number: string;
  order_date: string;
  status: string;
  total: { grand_total: { value: number; currency: string } };
}

export interface CustomerAddress {
  id: number;
  firstname: string;
  lastname: string;
  street: string[];
  city: string;
  region?: { region?: string | null } | null;
  postcode?: string | null;
  country_code?: string | null;
  telephone?: string | null;
  default_shipping?: boolean;
  default_billing?: boolean;
}

export interface Customer {
  firstname: string;
  lastname: string;
  email: string;
  is_subscribed?: boolean;
  orders: { total_count: number; items: CustomerOrder[] };
  addresses: CustomerAddress[];
}

/* ── Cart types ─────────────────────────────────────────────────── */

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
  applied_coupons?: { code: string }[] | null;
  prices: {
    subtotal_excluding_tax: Money;
    subtotal_including_tax?: Money | null;
    grand_total: Money;
    applied_taxes?: { amount: Money; label: string }[] | null;
    discounts?: { amount: Money; label: string }[] | null;
  };
  /** Magento ≥2.4.6 returns items under itemsV2; normalised to items by the API route. */
  items: ServerCartItem[];
  itemsV2?: { total_count: number; items: ServerCartItem[] } | null;
  available_payment_methods?: { code: string; title: string }[];
  shipping_addresses?: {
    selected_shipping_method?: {
      carrier_code: string; method_code: string; carrier_title?: string; amount: Money;
    } | null;
    available_shipping_methods?: ShippingMethodOption[];
  }[];
}
