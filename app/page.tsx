import HeroSlider from "@/components/home/HeroSlider";
import TyreFinder from "@/components/TyreFinder";
import OffersSection from "@/components/OffersSection";
import FastSelling from "@/components/FastSelling";
import HowItWorks from "@/components/HowItWorks";
import MobileDeliverySection from "@/components/MobileDeliverySection";
import AutoCareServices from "@/components/AutoCareServices";
import WhyChooseUs from "@/components/WhyChooseUs";
import FaqSection from "@/components/FaqSection";
// import NewsletterSection from "@/components/NewsletterSection";
import BrandStrip from "@/components/BrandStrip";
import AutomotiveBlog from "@/components/AutomotiveBlog";

export default function HomePage() {
  return (
    <div className="cms-home relative">
      {/* Hero banner slider */}
      <div className="main-banner" id="hero-section">
        <HeroSlider />
      </div>

      {/* Tyre / vehicle / brand search */}
      <TyreFinder />

      {/* Dynamic offers from Magento aggregations */}
      <OffersSection />

      {/* Fast-selling product carousel */}
      <FastSelling />

      {/* How it works */}
      <HowItWorks />

      {/* Auto care service categories */}
      <AutoCareServices />

      {/* Why choose us */}
      <WhyChooseUs />

      {/* Mobile delivery coverage — technician + Saudi Arabia map + van */}
      <MobileDeliverySection />

      {/* Shop by Tyre Brands */}
      <BrandStrip />

      {/* FAQ */}
      <FaqSection />

      {/* Automotive Blog */}
      <AutomotiveBlog />

    </div>
  );
}
