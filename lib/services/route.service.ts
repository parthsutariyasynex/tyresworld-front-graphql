/* ─────────────────────────────────────────────────────────────────
   ROUTE SERVICE
   Resolves any storefront URL to its Magento entity (product /
   category / CMS page) via the `urlResolver` (`route`) query.
   This is what makes routing fully dynamic: a new category or CMS
   page created in Magento Admin resolves automatically — no frontend
   route needs to be added.
───────────────────────────────────────────────────────────────── */
import { magentoFetch } from "@/lib/graphql/client";
import { ROUTE_QUERY } from "@/lib/queries";

export type RouteType = "PRODUCT" | "CATEGORY" | "CMS_PAGE";

export interface ResolvedRoute {
  type: RouteType | string;
  uid?: string;
  url_key?: string;
  sku?: string;
  name?: string;
  identifier?: string;
  title?: string;
}

const KNOWN_ROUTES: Record<string, ResolvedRoute> = {
  "car-battery": {
    type: "CATEGORY",
    uid: "MTExOA==",
    url_key: "car-battery",
    name: "Car Battery",
  },
  "battery": {
    type: "CATEGORY",
    uid: "MTExOA==",
    url_key: "car-battery",
    name: "Car Battery",
  },
  "batteries": {
    type: "CATEGORY",
    uid: "MTExOA==",
    url_key: "car-battery",
    name: "Car Battery",
  },
  "car-wheels": {
    type: "CATEGORY",
    uid: "MTExNw==",
    url_key: "car-wheels",
    name: "Car Wheels",
  },
  "wheels": {
    type: "CATEGORY",
    uid: "MTExNw==",
    url_key: "car-wheels",
    name: "Car Wheels",
  },
  "motorcycle-tyre": {
    type: "CATEGORY",
    uid: "MTExNg==",
    url_key: "motorcycle-tyre",
    name: "Motorcycle Tyres",
  },
  "motorcycle": {
    type: "CATEGORY",
    uid: "MTExNg==",
    url_key: "motorcycle-tyre",
    name: "Motorcycle Tyres",
  },
  "motorbike-tyres": {
    type: "CATEGORY",
    uid: "MTExNg==",
    url_key: "motorcycle-tyre",
    name: "Motorcycle Tyres",
  },
  "tyres": {
    type: "CATEGORY",
    uid: "MTg=",
    url_key: "tyres",
    name: "Tyres",
  },
  "on-road-tires": {
    type: "CATEGORY",
    uid: "MTg=",
    url_key: "on-road-tires",
    name: "On-Road Tires",
  },
  "off-road-tires-4x4": {
    type: "CATEGORY",
    uid: "MTg=",
    url_key: "off-road-tires-4x4",
    name: "Off-Road & 4x4 Tyres",
  },
  "ev-tires": {
    type: "CATEGORY",
    uid: "MTg=",
    url_key: "ev-tires",
    name: "EV Tyres",
  },
  "ev-tyres": {
    type: "CATEGORY",
    uid: "MTg=",
    url_key: "ev-tires",
    name: "EV Tyres",
  },
  "run-flat-tires": {
    type: "CATEGORY",
    uid: "MTg=",
    url_key: "run-flat-tires",
    name: "Run-Flat Tyres",
  },
  "special-offers": {
    type: "CMS_PAGE",
    identifier: "special-offers",
    title: "Special Offers",
  },
};

/**
 * Resolve a URL path (bare slug, no store prefix, no ".html" suffix) to
 * its underlying Magento entity. Returns null when nothing matches.
 */
export async function resolveRoute(url: string, store?: string): Promise<ResolvedRoute | null> {
  const cleanUrl = url.replace(/^\/+|\/+$/g, "").toLowerCase();

  try {
    const r = await magentoFetch<{ route?: ResolvedRoute | null }>(
      ROUTE_QUERY,
      { url },
      { store, revalidate: 3600 },
    );
    if (r.ok && r.data?.route) return r.data.route;
  } catch (err) {
    console.warn(`[resolveRoute] Magento query failed for "${url}":`, err);
  }

  // Fallback to known routes and aliases
  if (KNOWN_ROUTES[cleanUrl]) {
    return KNOWN_ROUTES[cleanUrl];
  }

  return null;
}
