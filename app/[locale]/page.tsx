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

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default function LocaleHomePage({
  params,
}: {
  params: { locale: string };
}) {
  if (params.locale !== "en" && params.locale !== "ar") notFound();

  return (
    <>
      <HeroSlider />
      <TyreFinder locale={params.locale} />
      <OffersSection />
      <FastSelling />
      <HowItWorks />
      <AutoCareServices />
      <WhyChooseUs />
      <MobileDeliverySection />
      <BrandStrip />
      <FaqSection />
      <AutomotiveBlog />
    </>
  );
}
