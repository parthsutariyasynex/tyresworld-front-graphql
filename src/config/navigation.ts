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
  labelAr: string;
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
    labelAr: "الإطارات",
    slug: "tyres",
    children: [
      { id: "all-tyres",     label: "All Tyres",        labelAr: "جميع الإطارات",              slug: "tyres" },
      { id: "ev-tyres",      label: "EV Tyres",         labelAr: "إطارات المركبات الكهربائية", slug: "ev-tyres" },
      { id: "tyres-size",    label: "Tyres by Size",    labelAr: "الإطارات حسب المقاس",        slug: "tyres" },
      { id: "tyres-brand",   label: "Tyres by Brand",   labelAr: "الإطارات حسب العلامة",       slug: "brands" },
      { id: "tyres-vehicle", label: "Tyres by Vehicle", labelAr: "الإطارات حسب نوع السيارة",   slug: "tyres" },
    ],
  },
  {
    id: "car-battery",
    label: "Car Battery",
    labelAr: "بطارية السيارة",
    slug: "car-battery",
  },
  {
    id: "car-insurance",
    label: "Car Insurance",
    labelAr: "تأمين السيارات",
    slug: "car-insurance",
  },
  {
    id: "car-services",
    label: "Car Services",
    labelAr: "خدمات السيارات",
    slug: "car-service",
    children: [
      { id: "svc-tyre",      label: "Car Tyre Service",            labelAr: "خدمة إطارات السيارات",     slug: "car-tyre-service-abu-dhabi" },
      { id: "svc-battery",   label: "Car Battery Service",         labelAr: "خدمة بطاريات السيارات",    slug: "car-battery-service-abu-dhabi" },
      { id: "svc-ac",        label: "Car AC Service",              labelAr: "خدمة تكييف السيارات",      slug: "car-ac-service-abu-dhabi" },
      { id: "svc-brake",     label: "Car Brake Service",           labelAr: "خدمة فرامل السيارات",      slug: "car-brake-service-abu-dhabi" },
      { id: "svc-oil",       label: "Car Oil Change Service",      labelAr: "خدمة تغيير زيت السيارات",  slug: "car-oil-change-service-abu-dhabi" },
      { id: "svc-mech",      label: "Car Mechanical Service",      labelAr: "الخدمة الميكانيكية للسيارات", slug: "car-mechanical-service-abu-dhabi" },
      { id: "svc-alignment", label: "Car Wheel Alignment Service", labelAr: "خدمة ضبط زوايا العجلات",   slug: "car-wheel-alignment-service-abu-dhabi" },
      { id: "svc-balancing", label: "Car Wheel Balancing Service", labelAr: "خدمة موازنة العجلات",      slug: "car-wheel-balancing-service-abu-dhabi" },
      { id: "svc-rim",       label: "Car Rim Repair Service",      labelAr: "خدمة إصلاح جنوط السيارات", slug: "car-rim-repair-service-abu-dhabi" },
    ],
  },
  {
    id: "rims-wheels",
    label: "Rims/Wheels",
    labelAr: "الجنوط والعجلات",
    slug: "car-wheels",
  },
  {
    id: "motorbike-tyres",
    label: "Motorbike Tyres",
    labelAr: "إطارات الدراجات النارية",
    slug: "motorcycle-tyre",
  },
  {
    id: "offers",
    label: "Offers",
    labelAr: "العروض",
    slug: "special-offers",
  },
  {
    id: "installers",
    label: "Installer Network",
    labelAr: "شبكة مراكز التركيب",
    slug: "fitting-installation-partner",
  },
  {
    id: "faq",
    label: "FAQs",
    labelAr: "الأسئلة الشائعة",
    slug: "faq",
  },
  {
    id: "contact",
    label: "Contact Us",
    labelAr: "اتصل بنا",
    slug: "contact",
  },
];

/** Locale-prefixed href for a nav item. */
export function navHref(item: NavItem, locale: string): string {
  return item.slug ? `/${locale}/${item.slug}` : `/${locale}`;
}

/** Label for the active locale. */
export function navLabel(item: NavItem, locale: string): string {
  return locale === "ar" ? item.labelAr : item.label;
}

/** True when `pathname` is on `item` (or one of its children). */
export function isNavActive(item: NavItem, pathname: string, locale: string): boolean {
  const href = navHref(item, locale);
  if (!item.slug) return pathname === `/${locale}` || pathname === "/";
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return !!item.children?.some((c) => isNavActive(c, pathname, locale));
}
