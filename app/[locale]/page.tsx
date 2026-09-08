import PartoraHero from "@/components/home/partora/PartoraHero";
import FinderShell from "@/components/home/partora/FinderShell";
import StickyBottomFinder from "@/components/home/partora/StickyBottomFinder";
import OffersSection from "@/components/OffersSection";
import HowItWorks from "@/components/HowItWorks";
import AutoCareServices from "@/components/AutoCareServices";
import WhyChooseUs from "@/components/WhyChooseUs";
import BrandStrip from "@/components/BrandStrip";
import AboutUs from "@/components/AboutUs";
import AutomotiveBlog from "@/components/AutomotiveBlog";

export const dynamic = "force-dynamic";

// Pre-generate the home page for supported locales
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

/**
 * Home page — Partora-style layout.
 */
export default function LocaleHomePage({
  params,
}: {
  params?: { locale?: string };
}) {
  const locale = params?.locale === "ar" ? "ar" : "en";

  return (
    <div className="ptr-home">
      {/* ── Hero: toolbar + category rail + banner slider ── */}
      <PartoraHero locale={locale} />

      {/* ── Search / Finder (Hero Box) ───────────────────────────── */}
      <FinderShell locale={locale} />

      {/* ── Sticky Bottom Floating Search (Appears on scroll) ─────── */}
      <StickyBottomFinder locale={locale} />

      {/* ── Offers from Magento ─────────────────────────────────── */}
      <OffersSection />

      {/* ── How It Works (Immediately after Offers) ──────────────── */}
      <HowItWorks locale={locale} />

      {/* ── Services: Auto Care Categories Carousel ──────────────── */}
      <AutoCareServices locale={locale} />

      {/* ── Top Reasons To Buy Online Tyres (Why Choose Us) ──────── */}
      <WhyChooseUs locale={locale} />

      {/* ── About Us (Immediately after Why Choose Us) ───────────── */}
      <AboutUs />

      {/* ── Brands ──────────────────────────────────────────────── */}
      <BrandStrip />

      {/* ── Automotive Blog ─────────────────────────────────────── */}
      <AutomotiveBlog locale={locale} />
    </div>
  );
}
