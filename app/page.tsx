import HeroSlider from "@/components/home/HeroSlider";
import TrustBar from "@/components/TrustBar";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import BrandStrip from "@/components/BrandStrip";
import TrendingProducts from "@/components/home/TrendingProducts";
import Testimonials from "@/components/home/Testimonials";
import NewsletterSection from "@/components/NewsletterSection";

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <TrustBar />
      <CategorySection />
      <FeaturedProducts />
      <BrandStrip />
      <TrendingProducts />
      <Testimonials />
      <NewsletterSection />
    </>
  );
}
