"use client";

import { useRef } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";

const OFFER_BANNERS = [
  { id: "b1", image: "/offers/buy-2-get-2-free-bridgestone_1.webp", alt: "Buy 2 Get 2 Free – Bridgestone", href: "/shop?offers=buy2get2" },
  { id: "b2", image: "/offers/power-tire-offers-banner-v3-webp.webp", alt: "Buy Now Pay Later – PowerTyre", href: "/shop" },
  { id: "b3", image: "/offers/buy-3-get-1-free-continental.webp", alt: "Buy 3 Get 1 Free – Continental", href: "/shop?offers=buy3get1" },
  { id: "b4", image: "/offers/image-en.jpg", alt: "Special Offer – PowerTyre", href: "/shop" },
];

/* ─── Main section ─────────────────────────────────────────────── */
export default function OffersSection({ store = "default" }: { store?: string }) {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section className="py-12 lg:py-16 bg-white border-t border-gray-100">
      <div className="container">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-black tracking-widest uppercase leading-tight">
            <span className="text-gray-900">Special </span>
            <span className="text-[#ed1c24]">Offers</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            Limited-Time Deals on Top Tyre Brands
          </p>
        </div>

        {/* ── Banner Swiper ───────────────────────────────────── */}
        <div className="relative px-10 sm:px-12 mb-8">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-[#ed1c24] hover:text-white hover:border-[#ed1c24] transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>

          <Swiper
            onSwiper={(s) => { swiperRef.current = s; }}
            modules={[Autoplay]}
            autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            spaceBetween={24}
            loop={true}
            breakpoints={{
              320: { slidesPerView: 1 },
              768: { slidesPerView: 1.5 },
              1024: { slidesPerView: 2 },
            }}
            className="offers-swiper"
          >
            {OFFER_BANNERS.map((banner) => (
              <SwiperSlide key={banner.id}>
                <Link
                  href={banner.href}
                  className="block relative aspect-[810/380] rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.image}
                    alt={banner.alt}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Right Arrow Button: Solid red circular background */}
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] text-white flex items-center justify-center transition-colors z-10 shadow-sm focus:outline-none"
            aria-label="Next slide"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>

        </div>

      </div>
    </section>
  );
}
