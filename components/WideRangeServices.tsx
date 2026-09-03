import Link from "next/link";

/**
 * "Wide range of services" — the icon grid of individual car services.
 *
 * Slugs match the `car-services` children in src/config/navigation.ts, so
 * the header dropdown and this grid point at the same pages. Labels are
 * intentionally friendlier here than in the nav ("Tyre Change & Repair"
 * rather than "Car Tyre Service"), matching the theme's own copy.
 *
 * Icons are line art on transparency (418×418, black + Racing Red), so the
 * cards need a light surface — see `.service-card` in app/globals.css.
 */
const SERVICES = [
  {
    slug: "car-tyre-service-abu-dhabi",
    label: "Tyre Change & Repair",
    labelAr: "تغيير وإصلاح الإطارات",
    icon: "/service-icons/service-icons-01.png",
  },
  {
    slug: "car-wheel-alignment-service-abu-dhabi",
    label: "Wheel Alignment Service",
    labelAr: "خدمة ضبط زوايا العجلات",
    icon: "/service-icons/service-icons-02.png",
  },
  {
    slug: "car-battery-service-abu-dhabi",
    label: "Battery Replacement",
    labelAr: "استبدال البطارية",
    icon: "/service-icons/service-icons-03.png",
  },
  {
    slug: "car-brake-service-abu-dhabi",
    label: "Brake Pad Replacement Service",
    labelAr: "خدمة استبدال وسادات الفرامل",
    icon: "/service-icons/service-icons-04.png",
  },
  {
    slug: "car-oil-change-service-abu-dhabi",
    label: "Oil Change",
    labelAr: "تغيير الزيت",
    icon: "/service-icons/service-icons-05.png",
  },
  {
    slug: "car-ac-service-abu-dhabi",
    label: "AC Repair & Gas Refill",
    labelAr: "إصلاح التكييف وتعبئة الغاز",
    icon: "/service-icons/service-icons-06.png",
  },
  {
    slug: "car-rim-repair-service-abu-dhabi",
    label: "Car Rim Repair",
    labelAr: "إصلاح جنوط السيارات",
    icon: "/service-icons/service-icons-07.png",
  },
  {
    slug: "car-mechanical-service-abu-dhabi",
    label: "Mechanical Service",
    labelAr: "الخدمة الميكانيكية",
    icon: "/service-icons/service-icons-08.png",
  },
];

export default function WideRangeServices({ locale = "en" }: { locale?: string }) {
  const isAr = locale === "ar";

  return (
    <section className="section section-padding services">
      <div className="container">

        {/* ── Section title ───────────────────────────────────── */}
        <div className="section-heading">
          <h2>
            {isAr ? "مجموعة واسعة من " : "Wide range of "}
            <span className="theme_color">{isAr ? "الخدمات" : "services"}</span>
          </h2>
          <p>
            {isAr
              ? "يقدم فريقنا من الفنيين المهرة، مع مرفق مجهز بالكامل، مجموعة واسعة من خدمات السيارات في أبوظبي للحفاظ على سيارتك في أفضل حال."
              : "Our team of skilled technicians, combined with a fully equipped facility, provides a wide range of car services in Abu Dhabi to keep your car running at its best."}
          </p>
        </div>

        {/* ── Service grid — 2 / 3 / 4 columns ────────────────── */}
        <ul className="service-grid">
          {SERVICES.map((service) => (
            <li key={service.slug}>
              <Link href={`/${locale}/${service.slug}`} className="service-card">
                <span className="service-card-icon">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={service.icon}
                    alt=""
                    aria-hidden="true"
                    width={418}
                    height={418}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <h3 className="service-card-title">
                  {isAr ? service.labelAr : service.label}
                </h3>
              </Link>
            </li>
          ))}
        </ul>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="section-cta">
          <Link href={`/${locale}/car-service-abudhabi`} className="button-primary">
            <span>{isAr ? "عرض جميع خدمات السيارات" : "View All Car Services"}</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
