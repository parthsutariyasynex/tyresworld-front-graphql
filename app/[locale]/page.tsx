import MainBanner from "@/components/home/MainBanner";
import OffersSection from "@/components/OffersSection";
import HowItWorks from "@/components/HowItWorks";
import AutoCareServices from "@/components/AutoCareServices";
import WhyChooseUs from "@/components/WhyChooseUs";
import BrandStrip from "@/components/BrandStrip";
import AboutUs from "@/components/AboutUs";
import AutomotiveBlog from "@/components/AutomotiveBlog";
import { notFound } from "next/navigation";

// Pre-generate the home page for supported locales
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default function LocaleHomePage({
  params,
}: {
  params: { locale: string };
}) {
  // Return 404 for unsupported locales
  if (params.locale !== "en" && params.locale !== "ar") notFound();

  return (
    <>
      {/* Hero banner slider with the tyre finder overlaid on it */}
      <MainBanner locale={params.locale} />

      {/* Dynamic offers from Magento */}
      <OffersSection />

      {/* How TyresWorld works 3-step section */}
      <HowItWorks locale={params.locale} />

      {/* Your Trusted One-Stop Shop for Auto Care (6 Services) */}
      <AutoCareServices locale={params.locale} />

      {/* Top Reasons to Buy Online Tyres (Why Choose Us) */}
      <WhyChooseUs locale={params.locale} />

      {/* About us — showroom photo with the company copy */}
      <AboutUs />

      {/* Shop by tyre brands */}
      <BrandStrip />

      {/* Latest automotive blog posts */}
      <AutomotiveBlog locale={params.locale} />
    </>
  );
}