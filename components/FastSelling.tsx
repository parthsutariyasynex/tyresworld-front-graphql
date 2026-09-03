"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import TyreListingCard from "@/components/TyreListingCard";
import TyreListingCardSkeleton from "@/components/TyreListingCardSkeleton";
import type { Product } from "@/lib/data";
import { APP_CONFIG } from "@/src/config/app-config";


export default function FastSelling() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    // Temporary source: the MagePlaza bestsellers extension (mpSmtpBestsellers)
    // requires app_id/secret_key credentials that aren't configured, so we back
    // this carousel with a normal Tyres-category products query for now.
    //
    // FUTURE: restore the real bestsellers source once the mpSmtpBestsellers
    // query + credentials are fixed (see /api/bestsellers). Original call:
    //   fetch("/api/bestsellers?pageSize=12")
    fetch(`/api/products?categoryUid=${APP_CONFIG.magento.tyresCategoryUid}&pageSize=12`)
      .then((r) => r.json())
      .then((json: { products?: Product[] }) => {
        if (!active) return;
        setProducts((json.products ?? []).slice(0, 12));
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (error || (!loading && products.length === 0)) return null;

  return (
    <section className="py-12 lg:py-16 bg-[#f8f8f8]">
      <div className="container">

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-black tracking-widest uppercase">
            <span className="text-ink">Fast Selling </span>
            <span className="text-[#ed1c24]">Tires</span>
          </h2>
        </div>

        {/* Skeleton grid — outside Swiper so loop/autoplay init correctly after load */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => <TyreListingCardSkeleton key={i} />)}
          </div>
        )}

        {/* Live carousel */}
        {!loading && products.length > 0 && (
          <>
            <div className="relative">
              <div className="px-6 sm:px-10">
                <Swiper
                  onSwiper={(s) => { swiperRef.current = s; }}
                  modules={[Autoplay, Pagination]}
                  slidesPerView={1}
                  spaceBetween={14}
                  loop
                  speed={600}
                  autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                  pagination={{ clickable: true, el: ".fs-pagination" }}
                  className="fast-selling-swiper"
                  breakpoints={{
                    640:  { slidesPerView: 2, spaceBetween: 16 },
                    1024: { slidesPerView: 4, spaceBetween: 20 },
                  }}
                >
                  {products.map((product) => (
                    <SwiperSlide key={product.id} className="!h-auto">
                      <TyreListingCard product={product} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Prev arrow */}
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] flex items-center justify-center text-white shadow-md transition-colors"
                aria-label="Previous products"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Next arrow */}
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] flex items-center justify-center text-white shadow-md transition-colors"
                aria-label="Next products"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Pagination dots */}
            <div className="fs-pagination flex justify-center items-center gap-1.5 mt-6" />
          </>
        )}

      </div>
    </section>
  );
}
