import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MAIN_NAV, navHref, navLabel } from "@/src/config/navigation";

/**
 * Car Services grid.
 *
 * The list is not written out here — it is read from the `car-services`
 * entry in src/config/navigation.ts, the same source the header dropdown
 * renders. That means this section and the menu always show the identical
 * nine services, in the identical order, with the identical labels and
 * routes, in both locales. Adding a service to the nav adds it here.
 *
 * Only the artwork is mapped locally, keyed by the nav child's stable id.
 */
const ICONS: Record<string, string> = {
  "svc-tyre": "/service-icons/service-icons-01.png",       // car on lift + tyres
  "svc-battery": "/service-icons/service-icons-03.png",    // battery, +/- terminals
  "svc-ac": "/service-icons/service-icons-06.png",         // snowflake + wrench
  "svc-brake": "/service-icons/service-icons-04.png",      // brake disc + pad
  "svc-oil": "/service-icons/service-icons-05.png",        // oil can + drip
  "svc-mech": "/service-icons/service-icons-08.png",       // inspection clipboard
  "svc-alignment": "/service-icons/service-icons-02.png",  // axle + toe arrows
  /* No balancing-specific icon ships in /public/service-icons (there are
     eight for nine services). The axle pair is reused as the nearest
     honest match — drop a ninth icon in and change this one line. */
  "svc-balancing": "/service-icons/service-icons-02.png",
  "svc-rim": "/service-icons/service-icons-07.png",        // rim + warning
};

export default function ServicesGrid({ locale = "en" }: { locale?: string }) {
  const isAr = locale === "ar";

  const group = MAIN_NAV.find((item) => item.id === "car-services");
  const services = group?.children ?? [];

  if (services.length === 0) return null;

  return (
    <section className="ptr-section ptr-services">
      <div className="ptr-container">
        <header className="ptr-head">
          <div>
            <p className="ptr-services-eyebrow">
              <span aria-hidden="true" />
              {isAr ? "خدمات السيارات" : "CAR SERVICES"}
            </p>
            <h2 className="ptr-h2">
              {isAr ? "كل ما تحتاجه سيارتك" : "Everything your car needs"}
            </h2>
            <p className="ptr-sub">
              {isAr
                ? "فنيون معتمدون ومرفق مجهز بالكامل — خدمات سيارات شاملة في أبوظبي وجميع أنحاء الإمارات."
                : "Certified technicians and a fully equipped facility — complete car servicing in Abu Dhabi and across the UAE."}
            </p>
          </div>

          {group && (
            <Link href={navHref(group, locale)} className="ptr-link">
              {isAr ? "عرض جميع الخدمات" : "View all services"}
              <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
          )}
        </header>

        <ul className="ptr-services-grid">
          {services.map((service) => (
            <li key={service.id}>
              <Link href={navHref(service, locale)} className="ptr-service-card">
                <span className="ptr-service-icon">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ICONS[service.id] ?? "/service-icons/service-icons-08.png"}
                    alt=""
                    aria-hidden="true"
                    width={417}
                    height={417}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className="ptr-service-label">{navLabel(service, locale)}</span>
                <span className="ptr-service-go" aria-hidden="true">
                  <ArrowRight size={14} strokeWidth={2.4} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
