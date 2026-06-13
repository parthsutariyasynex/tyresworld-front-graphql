/* ─────────────────────────────────────────────────────────────────
   Magento customer auth + account GraphQL operations.
   Used server-side by app/api/account/route.ts.
───────────────────────────────────────────────────────────────── */

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
      total { grand_total { value currency } }
    }
  }
  addresses {
    id
    firstname
    lastname
    street
    city
    region { region }
    postcode
    country_code
    telephone
    default_shipping
    default_billing
  }
`;

export const AUTH_QUERIES = {
  register: `mutation Register($firstname: String!, $lastname: String!, $email: String!, $password: String!) {
    createCustomerV2(input: { firstname: $firstname, lastname: $lastname, email: $email, password: $password }) {
      customer { email }
    }
  }`,

  login: `mutation Login($email: String!, $password: String!) {
    generateCustomerToken(email: $email, password: $password) { token }
  }`,

  logout: `mutation Logout { revokeCustomerToken { result } }`,

  customer: `query Customer { customer { ${CUSTOMER_FIELDS} } }`,
};

/* ── Types for the account UI ─────────────────────────────────────── */
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
