"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * Exclusive Offers.
 *
 * Layout is the three-up reference: a bordered "Limited Time Offers" rail
 * on the left carrying the offer-banner carousel, and two full-bleed dark
 * offer tiles beside it.
 *
 * The two tiles are driven by the live `/api/offers` aggregation — the
 * same endpoint the listing filters use — so their labels and counts are
 * whatever Magento currently reports. Artwork comes from the banner list
 * below, matched to an offer by the `offers=` value already present in
 * each banner's href; an offer with no artwork falls back to a plain
 * asphalt tile rather than borrowing another offer's image.
 *
 * Note: there is deliberately no countdown clock. Magento's `offers`
 * attribute carries a label and a product count and nothing else — no
 * end date — so a ticking timer here would be invented urgency.
 */

/* Local banner artwork. Unchanged from the previous Offers section. */
const OFFER_BANNERS = [
  {
    id: "matrax-3plus1",
    image: "/offers/buy3-get1-free-matrax-tyres-uae.webp",
    alt: "Matrax 3+1 Free Tyre Offers in UAE",
    title: "Matrax 3+1 Free Tyre Offers in UAE",
    href: "/tyres?mgs_brand=Matrax&offers=Buy+3+Get+1+Free",
  },
  {
    id: "installments",
    image: "/offers/buy-tyres-pay-in-easy-installments-uae.webp",
    alt: "Shop tyres online and pay in installments",
    title: "Shop tyres online and pay in installments",
    href: "/tyres",
  },
  {
    id: "2026-tyres",
    image: "/offers/2026-tyres-online-uae_1.webp",
    alt: "2026 Tyres",
    title: "2026 Tyres",
    href: "/tyres?year=2026",
  },
  {
    id: "free-wheel-alignment",
    image: "/offers/free-wheel-alignment-offer-on-tyres-uae_1.webp",
    alt: "Free Wheel Alignment",
    title: "Free Wheel Alignment",
    href: "/tyres?offers=Free+Wheel+Alignment",
  },
  {
    id: "vredestein-3plus1",
    image: "/offers/buy3-get1-free-vredestein-tyres-uae.webp",
    alt: "Buy 3 Vredestein tyres online and get 1 free",
    title: "Buy 3 Vredestein tyres online and get 1 free",
    href: "/tyres?mgs_brand=Vredestein&offers=Buy+3+Get+1+Free",
  },
];

/** One entry as /api/offers returns it. */
type Offer = { label: string; value: string; count: number };

/** Artwork for an offer, matched on the `offers=` param in a banner href. */
function artworkFor(offerValue: string): string | null {
  const match = OFFER_BANNERS.find((b) => {
    const q = b.href.split("?")[1];
    if (!q) return false;
    return new URLSearchParams(q).get("offers") === offerValue;
  });
  return match?.image ?? null;
}

export default function OffersShowcase() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";
  const reducedMotion = usePrefersReducedMotion();

  const [offers, setOffers] = useState<Offer[] | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/offers")
      .then((r) => r.json())
      .then((data: { offers?: Offer[] }) => {
        if (active) setOffers(data?.offers ?? []);
      })
      .catch((err) => {
        console.error("Failed to load offers", err);
        if (active) setOffers([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const tiles = (offers ?? []).slice(0, 2);

  return (
    <section className="ptr-section ptr-offers">
      <div className="ptr-container">
        <div className="ptr-offers-grid">

          {/* ── Left rail — heading + banner carousel ─────────────── */}
          <div className="ptr-offers-rail">
            <p className="ptr-offers-eyebrow">
              {isAr ? "عروض حصرية" : "Exclusive Offers"}
            </p>
            <h2 className="ptr-offers-title">
              {isAr ? "عروض لفترة محدودة" : "Limited Time Offers"}
            </h2>

            <div className="ptr-offers-card">
              <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1}
                loop
                speed={600}
                autoplay={
                  reducedMotion
                    ? false
                    : { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }
                }
                pagination={{ clickable: true }}
                className="ptr-offers-swiper"
              >
                {OFFER_BANNERS.map((banner) => (
                  <SwiperSlide key={banner.id}>
                    <Link
                      href={`/${locale}${banner.href}`}
                      className="ptr-offers-slide"
                      title={banner.title}
                    >
                      <span className="ptr-offers-slide-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={banner.image} alt={banner.alt} loading="lazy" />
                      </span>
                      <span className="ptr-offers-slide-title">{banner.title}</span>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* ── Right — live offer tiles ──────────────────────────── */}
          {offers === null
            ? [0, 1].map((i) => <div key={i} className="ptr-offer-tile ptr-skel" aria-hidden="true" />)
            : tiles.map((offer) => {
                const image = artworkFor(offer.value);
                const href = `/${locale}/tyres?offers=${encodeURIComponent(offer.value)}`;

                return (
                  <Link key={offer.value} href={href} className="ptr-offer-tile">
                    {image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={image} alt="" className="ptr-offer-tile-img" loading="lazy" />
                    )}
                    <span className="ptr-offer-tile-veil" aria-hidden="true" />

                    <span className="ptr-offer-tile-body">
                      <span className="ptr-offer-tile-heading">{offer.label}</span>
                      <span className="ptr-offer-tile-desc">
                        {isAr
                          ? `${offer.count} إطاراً مؤهل لهذا العرض حالياً. تسوّق المجموعة كاملة عبر الإمارات.`
                          : `${offer.count} tyres currently qualify for this offer. Browse the full range across the UAE.`}
                      </span>
                      <span className="ptr-offer-tile-btn">
                        {isAr ? "اعرف المزيد" : "Learn More"}
                      </span>
                    </span>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
