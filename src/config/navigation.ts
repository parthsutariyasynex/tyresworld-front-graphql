/* ─────────────────────────────────────────────────────────────────
   MAIN NAVIGATION
   The storefront's primary menu. Curated here rather than pulled
   from Magento's category tree so the header order/labels stay
   fixed — the targets themselves still resolve dynamically through
   the [locale]/[slug] route (urlResolver), so no page route needs
   to exist for any of these slugs.
───────────────────────────────────────────────────────────────── */

export interface NavItem {
  /** Stable key for React + dropdown state. */
  id: string;
  label: string;
  /** Bare slug, no locale prefix and no ".html" suffix. "" = home. */
  slug: string;
  /** Render the dropdown as a wide multi-column panel. */
  mega?: boolean;
  children?: NavItem[];
}

export const MAIN_NAV: NavItem[] = [
  {
    id: "tyres",
    label: "Tyres",
    slug: "tyres",
    children: [
      { id: "all-tyres",     label: "All Tyres",        slug: "tyres" },
      { id: "ev-tyres",      label: "EV Tyres",         slug: "electric-vehicle-tyres-uae" },
      { id: "tyres-size",    label: "Tyres by Size",    slug: "tyres/size" },
      { id: "tyres-brand",   label: "Tyres by Brand",   slug: "brands" },
      { id: "tyres-vehicle", label: "Tyres by Vehicle", slug: "tyres/cars" },
    ],
  },
  {
    id: "car-battery",
    label: "Car Battery",
    slug: "car-battery-replacement",
  },
  {
    id: "car-insurance",
    label: "Car Insurance",
    slug: "car-insurance",
  },
  {
    id: "car-services",
    label: "Car Services",
    slug: "car-service",
    children: [
      { id: "svc-tyre",      label: "Car Tyre Service",            slug: "car-tyre-service" },
      { id: "svc-battery",   label: "Car Battery Service",         slug: "car-battery-service" },
      { id: "svc-ac",        label: "Car AC Service",              slug: "car-ac-service" },
      { id: "svc-brake",     label: "Car Brake Service",           slug: "car-brake-service" },
      { id: "svc-oil",       label: "Car Oil Change Service",      slug: "car-oil-change-service" },
      { id: "svc-mech",      label: "Car Mechanical Service",      slug: "car-mechanical-service" },
      { id: "svc-alignment", label: "Car Wheel Alignment Service", slug: "car-wheel-alignment-service" },
      { id: "svc-balancing", label: "Car Wheel Balancing Service", slug: "car-wheel-balancing-service" },
      { id: "svc-rim",       label: "Car Rim Repair Service",      slug: "car-rim-repair-service" },
    ],
  },
  {
    id: "rims-wheels",
    label: "Rims/Wheels",
    slug: "car-wheels",
  },
  {
    id: "motorbike-tyres",
    label: "Motorbike Tyres",
    slug: "motorcycle-tyre",
  },
  {
    id: "offers",
    label: "Offers",
    slug: "special-offers",
  },
  {
    id: "installers",
    label: "Installer Network",
    slug: "fitting-installation-partner",
  },
  {
    id: "faq",
    label: "FAQs",
    slug: "faq",
  },
  {
    id: "contact",
    label: "Contact Us",
    slug: "contact",
  },
];

/** Locale-prefixed href for a nav item. */
export function navHref(item: NavItem, locale: string): string {
  return item.slug ? `/${locale}/${item.slug}` : `/${locale}`;
}

/** Label for the active locale. */
export function navLabel(item: NavItem, _locale?: string): string {
  return item.label;
}

/** True when `pathname` is on `item` (or one of its children). */
export function isNavActive(item: NavItem, pathname: string, locale: string): boolean {
  const href = navHref(item, locale);
  if (!item.slug) return pathname === `/${locale}` || pathname === "/";
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return !!item.children?.some((c) => isNavActive(c, pathname, locale));
}
