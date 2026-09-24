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
import TestimonialsSection from "@/components/TestimonialsSection";
import { getHomepageData } from "@/lib/services/homepage.service";
import { storeCode, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Pre-generate the home page — English-only storefront
export function generateStaticParams() {
  return [{ locale: "en" }];
}

/**
 * Home page — Partora-style layout with 100% dynamic Magento data.
 */
export default async function LocaleHomePage({
  params,
}: {
  params?: { locale?: string };
}) {
  const locale = (params?.locale || "en") as Locale;
  const homepage = await getHomepageData(storeCode(locale));

  return (
    <div className="ptr-home">
      {/* ── Hero: toolbar + category rail + banner slider ── */}
      <PartoraHero locale={locale} initialHero={homepage?.hero} />

      {/* ── Search / Finder (Hero Box) ───────────────────────────── */}
      <FinderShell locale={locale} />

      {/* ── Sticky Bottom Floating Search (Appears on scroll) ─────── */}
      <StickyBottomFinder locale={locale} />

      {/* ── Offers from Magento ─────────────────────────────────── */}
      <OffersSection locale={locale} initialOffers={homepage?.offers} />

      {/* ── How It Works (Immediately after Offers) ──────────────── */}
      <HowItWorks locale={locale} initialHowItWorks={homepage?.how_it_works} />

      {/* ── Services: Auto Care Categories Carousel ──────────────── */}
      <AutoCareServices locale={locale} initialServices={homepage?.services} />

      {/* ── Top Reasons To Buy Online Tyres (Why Choose Us) ──────── */}
      <WhyChooseUs locale={locale} initialReasons={homepage?.top_reasons} />

      {/* ── Brands ──────────────────────────────────────────────── */}
      <BrandStrip initialBrandsSection={homepage?.brands} />

      {/* ── The UAE's Premier Destination For Tyres Online (About Us) ─ */}
      <AboutUs locale={locale} initialAbout={homepage?.about} />

      {/* ── Automotive Blog ─────────────────────────────────────── */}
      <AutomotiveBlog locale={locale} initialBlogSection={homepage?.blog} />

      {/* ── Testimonials (Dynamically enabled/disabled) ──────────── */}
      <TestimonialsSection testimonials={homepage?.testimonials} />
    </div>
  );
}
