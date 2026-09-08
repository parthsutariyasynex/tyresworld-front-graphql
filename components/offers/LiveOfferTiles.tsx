"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** One entry as /api/offers returns it. */
type Offer = { label: string; value: string; count: number };

/**
 * The live half of the Special Offers page.
 *
 * Reads the `offers` attribute aggregation from /api/offers — the same
 * endpoint the listing filters use — so the promotions and their product
 * counts are whatever Magento currently reports, not a fixed list. Each
 * tile deep-links into the filtered listing.
 */
export default function LiveOfferTiles({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [offers, setOffers] = useState<Offer[] | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/offers")
      .then((r) => r.json())
      .then((d: { offers?: Offer[] }) => {
        if (active) setOffers(d?.offers ?? []);
      })
      .catch((err) => {
        console.error("Failed to load offers", err);
        if (active) setOffers([]);
      });

    return () => {
      active = false;
    };
  }, []);

  /* Nothing to advertise — render nothing rather than an empty shell. */
  if (offers !== null && offers.length === 0) return null;

  return (
    <section className="so-live">
      <h2 className="so-h2">
        {isAr ? "العروض النشطة الآن" : "Offers running right now"}
      </h2>

      <div className="so-live-grid">
        {offers === null
          ? [0, 1].map((i) => <div key={i} className="so-live-card so-skel" aria-hidden="true" />)
          : offers.map((o) => (
              <Link
                key={o.value}
                href={`/${locale}/tyres?offers=${encodeURIComponent(o.value)}`}
                className="so-live-card"
              >
                <span className="so-live-label">{o.label}</span>
                <span className="so-live-count">
                  {isAr ? `${o.count} إطاراً مؤهل` : `${o.count} tyres qualify`}
                </span>
                <span className="so-live-go">
                  {isAr ? "تسوق العرض" : "Shop this offer"}
                  <ArrowRight size={14} strokeWidth={2.4} />
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
