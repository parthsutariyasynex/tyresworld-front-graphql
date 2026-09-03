import HeroSlider from "@/components/home/HeroSlider";
import TyreFinder from "@/components/TyreFinder";

/**
 * Homepage hero: the full-width banner slider with the tyre finder laid
 * over its lower edge.
 *
 * Both halves stay separate components — the finder is reused on category
 * and product pages — but on the homepage they belong to one visual block,
 * so they share a positioned <section> the way the Magento theme's
 * `.main-banner > .row.position-relative` does.
 *
 * The overlap itself is CSS, in app/globals.css:
 *   ≥1024px  .cms-home .tyreform is absolute, pulled up over the banner
 *   <1024px  it returns to normal flow beneath the banner
 *   scrolled .tyreform.sticky pins it under the header
 */
export default function MainBanner({ locale }: { locale: string }) {
  return (
    <section className="section main-banner">
      <HeroSlider />
      <TyreFinder locale={locale} />
    </section>
  );
}
