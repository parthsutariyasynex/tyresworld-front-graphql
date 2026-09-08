import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import LiveOfferTiles from "@/components/offers/LiveOfferTiles";
import { getCmsPage } from "@/lib/services/cms.service";
import { storeView } from "@/src/config/app-config";
import { OFFER_BANNERS, SEO_INTRO, SEO_SECTIONS, FAQS } from "./content";

/**
 * Special Offers.
 *
 * A dedicated route rather than the [...slug] catch-all, because the
 * Magento CMS page for this URL has no usable body: its content is a
 * single `{{block template="Magento_Theme::pages/special-offers.phtml"}}`
 * directive, and GraphQL returns only the "Error filtering template"
 * string for it. Rendered through the catch-all, customers saw that raw
 * PHP error on the page.
 *
 * Title and meta still come from Magento (they resolve fine); only the
 * body is rendered here. Delete this route and the catch-all takes over
 * again the moment the CMS page holds real content.
 */

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const page = await getCmsPage("special-offers", storeView(params.locale));

  return {
    title: page?.meta_title || page?.title || "Special Offers",
    description:
      page?.meta_description ||
      "Current tyre deals in the UAE — seasonal discounts, buy-3-get-1, free wheel alignment and interest-free instalments, with fitting across the Emirates.",
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default async function SpecialOffersPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  if (locale !== "en" && locale !== "ar") notFound();

  const isAr = locale === "ar";
  const page = await getCmsPage("special-offers", storeView(locale));

  const heading =
    page?.content_heading || page?.title || (isAr ? "العروض الخاصة" : "Special Offers");

  /* Marked up so the FAQ block is eligible for rich results, the same
     way the Magento page is. */
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="so-page">
      <JsonLd data={faqJsonLd} />

      {/* ── Page head ─────────────────────────────────────────── */}
      <div className="so-hero">
        <div className="so-container">
          <nav className="so-crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isAr ? "الرئيسية" : "Home"}</Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span aria-current="page">{isAr ? "العروض الخاصة" : "Special Offers"}</span>
          </nav>
          <h1 className="so-h1">{heading}</h1>
        </div>
      </div>

      <div className="so-container so-body">
        {/* ── Offer banners ───────────────────────────────────── */}
        <section aria-label={isAr ? "العروض" : "Offers"}>
          <div className="so-banners">
            {OFFER_BANNERS.map((b) => (
              <Link key={b.id} href={`/${locale}${b.href}`} className="so-banner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt={b.alt} width={559} height={391} loading="lazy" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Live offer aggregation from Magento ─────────────── */}
        <LiveOfferTiles locale={locale} />

        {/* ── Prose ───────────────────────────────────────────── */}
        <section className="so-prose">
          <h2 className="so-h2">
            {isAr ? "أفضل عروض الإطارات في " : "Best Tyre Deals at "}
            <span className="so-accent">TyresWorld</span>
          </h2>
          <p className="so-lead">{SEO_INTRO}</p>

          <div className="so-sections">
            {SEO_SECTIONS.map((s) => (
              <div key={s.heading} className="so-section">
                <h3>{s.heading}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section className="so-faq">
          <h2 className="so-h2">
            {isAr ? "أسئلة شائعة عن " : "FAQs About "}
            <span className="so-accent">{isAr ? "العروض" : "Tyre Offers"}</span>
          </h2>

          <div className="so-faq-list">
            {FAQS.map((f) => (
              <details key={f.q} className="so-faq-item">
                <summary>
                  {f.q}
                  <ChevronRight size={16} aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
