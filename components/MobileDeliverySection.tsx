"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type DeliveryBanner = {
  id: string;
  badge?: string;
  title: string;
  cta: string;
  href: string;
  image: string;
};

const MAIN_CITIES = ["Riyadh", "Jeddah", "Dammam", "Al-Khobar"];

const DELIVERY_BANNERS: DeliveryBanner[] = [
  {
    id: "db-1",
    badge: "New",
    title: "WIDE RANGE\nOFF ROAD\nTIRES",
    cta: "Shop Now",
    href: "/",
    image: "/whild-range.jpg",
  },
  {
    id: "db-2",
    title: "STAY SAFE AND\nSAVE TIME",
    cta: "Click here",
    href: "/#search",
    image: "/stay-safe.jpg",
  },
  {
    id: "db-3",
    title: "WE ARE HERE TO\nHELP",
    cta: "Contact Us",
    href: "/contact",
    image: "/to-help.jpg",
  },
];

function PinIcon() {
  return (
    <svg width="11" height="15" viewBox="0 0 11 15" fill="none" aria-hidden>
      <path
        d="M5.5 0C2.46 0 0 2.46 0 5.5C0 9.62 5.5 15 5.5 15C5.5 15 11 9.62 11 5.5C11 2.46 8.54 0 5.5 0ZM5.5 7.5C4.4 7.5 3.5 6.6 3.5 5.5C3.5 4.4 4.4 3.5 5.5 3.5C6.6 3.5 7.5 4.4 7.5 5.5C7.5 6.6 6.6 7.5 5.5 7.5Z"
        fill="#ed1c24"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FBBC05" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function BannerCardSkeleton() {
  return (
    <div className="image-box">
      <div className="image-wrap aspect-custom animate-pulse bg-gray-200" />
    </div>
  );
}

function BannerCard({ banner }: { banner: DeliveryBanner }) {
  return (
    <div className="image-box group">
      <Link href={banner.href} className="link block">
        <div className="image-wrap picture loader aspect-custom">
          {banner.image ? (
            <Image
              src={banner.image}
              alt={banner.title.replace(/\n/g, " ")}
              fill
              priority={false}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-300" />
          )}

          <div className="inner-content">
            {banner.badge && (
              <span className="inline-block bg-[#ed1c24] text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 uppercase tracking-wide">
                {banner.badge}
              </span>
            )}
            <h4 className="text-white font-black text-xl lg:text-[22px] leading-tight mb-3 uppercase whitespace-pre-line">
              {banner.title}
            </h4>
            <span className="inline-flex items-center gap-1.5 text-white text-[13px] font-semibold">
              {banner.cta}
              <ArrowRight />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function GoogleReviewsBadge() {
  return (
    <div className="absolute bottom-4 left-8 bg-white text-black px-4 py-2.5 rounded-2xl flex flex-col shadow-lg border border-gray-100/80 z-10 scale-90 sm:scale-100 origin-bottom-left select-none">
      {/* Top Part: G Logo + Text */}
      <div className="flex items-center gap-2">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
          alt="Google Logo"
          className="w-5 h-5 shrink-0"
        />
        <span className="text-black font-semibold text-[13px] tracking-tight">Google Reviews</span>
      </div>
      
      {/* Bottom Part: Rating + Stars */}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-black font-black text-[22px] leading-none tracking-tight">4.9</span>
        <div className="flex text-amber-400 gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-4.5 h-4.5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MobileDeliverySection() {
  const cards = DELIVERY_BANNERS;

  return (
    <section className="bg-white py-12 lg:py-16">

      {/* ── Text block ───────────────────────────────────────────── */}
      <div className="container text-center">
        <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black uppercase tracking-tight text-black mb-5 leading-tight">
          GET YOUR TIRES DELIVERED PROFESSIONALLY INSTALLED!
        </h2>

        <p className="font-black uppercase text-black text-[15px] tracking-widest mb-5">
          MOBILE SERVICE{" "}
          <span className="font-light text-gray-400 tracking-wide">AMAZING</span>
        </p>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-5">
          {MAIN_CITIES.map(city => (
            <div key={city} className="flex items-center gap-1.5 text-[13px] font-semibold text-black">
              <PinIcon />
              {city}
            </div>
          ))}
        </div>

        <p className="font-black uppercase text-black text-[15px] tracking-widest mb-3">
          SHIPPING ACROSS{" "}
          <span className="font-light text-gray-400 tracking-wide">SAUDI ARABIA</span>
        </p>

        <p className="text-xs text-gray-400 italic max-w-2xl mx-auto leading-relaxed">
          Installation is available at authorized service centers in: Madina – Abha –
          Makkah – Buraydah – Jubail – Tabuk – Yanbu – Taif – Qatif, guided with
          precision like a professional
        </p>
      </div>

      {/* ── Technician + map visual ──────────────────────────────── */}
      <div className="relative mt-6 mx-auto max-w-5xl px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tire-van-map.jpg"
          alt="PowerTyre technician and delivery van across Saudi Arabia"
          className="w-full h-auto object-contain"
          loading="lazy"
        />
        <GoogleReviewsBadge />
      </div>

      {/* ── Three banner image cards ─────────────────────────────── */}
      <div className="container mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
          {cards.map((card, i) =>
            card === null
              ? <BannerCardSkeleton key={i} />
              : <BannerCard key={card.id} banner={card} />
          )}
        </div>
      </div>

    </section>
  );
}
