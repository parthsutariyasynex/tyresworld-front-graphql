import HeroSlider from "@/components/home/HeroSlider";
import TyreFinder from "@/components/TyreFinder";
import OffersSection from "@/components/OffersSection";
import FastSelling from "@/components/FastSelling";
import HowItWorks from "@/components/HowItWorks";
import MobileDeliverySection from "@/components/MobileDeliverySection";
import AutoCareServices from "@/components/AutoCareServices";
import WhyChooseUs from "@/components/WhyChooseUs";
import FaqSection from "@/components/FaqSection";
import BrandStrip from "@/components/BrandStrip";
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
      {/* Hero banner slider */}
      <HeroSlider />

      {/* Tyre / vehicle / brand search */}
      <TyreFinder locale={params.locale} />

      {/* Dynamic offers from Magento */}
      <OffersSection />

      {/* Fast-selling product carousel */}
      <FastSelling />

      {/* How it works */}
      <HowItWorks />

      {/* Auto care service categories */}
      <AutoCareServices />

      {/* Why choose us */}
      <WhyChooseUs />

      {/* Mobile delivery coverage — technician + map + service van */}
      <MobileDeliverySection />

      {/* Shop by tyre brands */}
      <BrandStrip />

      {/* Frequently Asked Questions */}
      <FaqSection />

      {/* Latest automotive blog posts */}
      <AutomotiveBlog />
    </>
  );
}