"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AutoCareServicesProps {
  locale?: string;
}

interface AutoCareCategory {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  bannerTitle: string;
  bannerBg: string;
  roundImg: string;
  badge: string;
  badgeAr: string;
  description: string;
  descriptionAr: string;
  feature: string;
  featureAr: string;
  ctaText: string;
  ctaTextAr: string;
}

const AUTO_CARE_CATEGORIES: AutoCareCategory[] = [
  {
    id: "cat-tyres",
    slug: "tyres",
    title: "Car Tyres",
    titleAr: "إطارات السيارات",
    bannerTitle: "PREMIUM CAR TYRES",
    bannerBg: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?q=80&w=800&auto=format&fit=crop",
    roundImg: "/YourTrustedAutoCare/service-sample.jpg",
    badge: "100% Fitment",
    badgeAr: "توافق 100%",
    description: "Premium car, SUV & 4x4 tyres from top global brands with manufacturer warranty and free mobile doorstep fitting.",
    descriptionAr: "إطارات سيارات ودفع رباعي من أفضل الماركات العالمية مع ضمان الوكيل وتركيب متنقل مجاني عند باب منزلك.",
    feature: "Free Mobile Doorstep Fitting",
    featureAr: "تركيب متنقل مجاني عند بيتك",
    ctaText: "Shop Tyres",
    ctaTextAr: "تسوق الإطارات",
  },
  {
    id: "cat-insurance",
    slug: "car-insurance",
    title: "Car Insurance",
    titleAr: "تأمين السيارات",
    bannerTitle: "CAR INSURANCE ONLINE",
    bannerBg: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800&auto=format&fit=crop",
    roundImg: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=400&auto=format&fit=crop",
    badge: "Instant Quotes",
    badgeAr: "عروض فورية",
    description: "Compare comprehensive & third-party car insurance quotes instantly from UAE's leading insurance providers.",
    descriptionAr: "قارن أسعار تأمين السيارات الشامل وضد الغير فوراً بأفضل الأسعار وأسرع إصدار للوثائق في الإمارات.",
    feature: "Best Rates & Instant Policy",
    featureAr: "أفضل الأسعار وإصدار فوري",
    ctaText: "Get Insurance",
    ctaTextAr: "احصل على التأمين",
  },
  {
    id: "cat-rims",
    slug: "rims-wheels",
    title: "Rims / Wheels",
    titleAr: "الجنوط والعجلات",
    bannerTitle: "ALLOY RIMS & WHEELS",
    bannerBg: "/YourTrustedAutoCare/car-rim.jpg",
    roundImg: "/YourTrustedAutoCare/car-rim.jpg",
    badge: "Custom Alloys",
    badgeAr: "جنوط سبور أصلية",
    description: "Discover stylish alloy wheels, high-performance rims, precision fitment, and professional rim repair services.",
    descriptionAr: "اكتشف تشكيلة واسعة من الجنوط الرياضية والعجلات الأصلية بمختلف المقاسات مع خدمات التركيب الاحترافي.",
    feature: "Precision Wheel Fitment",
    featureAr: "مقاسات وملاءمة دقيقة",
    ctaText: "Explore Rims",
    ctaTextAr: "تصفح الجنوط",
  },
  {
    id: "cat-battery",
    slug: "car-battery-service-abu-dhabi",
    title: "Car Battery",
    titleAr: "بطاريات السيارات",
    bannerTitle: "EXPRESS BATTERY FITTING",
    bannerBg: "/YourTrustedAutoCare/car-battery.jpg",
    roundImg: "/YourTrustedAutoCare/car-battery.jpg",
    badge: "30-Min Delivery",
    badgeAr: "توصيل 30 دقيقة",
    description: "On-demand car battery replacement, digital battery health testing, and official warranty delivered in 30 minutes.",
    descriptionAr: "خدمة استبدال بطارية السيارة أينما كنت، فحص مجاني للبطارية وضمان رسمي يصلك خلال 30 دقيقة.",
    feature: "Official Warranty Included",
    featureAr: "ضمان رسمي معتمد",
    ctaText: "Order Battery",
    ctaTextAr: "اطلب بطارية",
  },
  {
    id: "cat-service",
    slug: "car-service-abudhabi",
    title: "Car Service",
    titleAr: "صيانة وخدمات السيارات",
    bannerTitle: "COMPLETE AUTO REPAIR",
    bannerBg: "/YourTrustedAutoCare/car-service-img.jpg",
    roundImg: "/YourTrustedAutoCare/car-service-img.jpg",
    badge: "Full Diagnostics",
    badgeAr: "فحص وصيانة شاملة",
    description: "Complete car servicing, brake replacement, AC gas refill, oil change, laser alignment and mechanical repairs.",
    descriptionAr: "صيانة كاملة للمركبات، تغيير الزيت والفرامل، تعبئة غاز التكييف، ميزان الليزر وجميع الخدمات الميكانيكية.",
    feature: "Certified Expert Mechanics",
    featureAr: "فنيون معتمدون وذوو خبرة",
    ctaText: "Book Service",
    ctaTextAr: "حجز الخدمة",
  },
  {
    id: "cat-motorbike",
    slug: "tyres?vehicle=bike",
    title: "Motorbike Tyres",
    titleAr: "إطارات الدراجات النارية",
    bannerTitle: "MOTORBIKE TYRES",
    bannerBg: "/YourTrustedAutoCare/motorbike-tyre.jpg",
    roundImg: "/YourTrustedAutoCare/motorbike-tyre.jpg",
    badge: "High Grip",
    badgeAr: "ثبات وأداء عالي",
    description: "High-performance motorcycle tyres for sports, cruiser, off-road and commuter bikes with expert fitting.",
    descriptionAr: "إطارات دراجات نارية فائقة الأداء للدراجات الرياضية والكلاسيكية والوعرة مع تركيب احترافي وموازنة.",
    feature: "Top Brands for All Bikes",
    featureAr: "أفضل الماركات لجميع الدراجات",
    ctaText: "Shop Bike Tyres",
    ctaTextAr: "إطارات الدراجات",
  },
];

export default function AutoCareServices({ locale = "en" }: AutoCareServicesProps) {
  const isAr = locale === "ar";
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  return (
    <section className="ptr-section bg-[#fbfbfb] py-12 lg:py-16 border-t border-b border-gray-100/80">
      <div className="ptr-container">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ed1c24]/10 border border-[#ed1c24]/20 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#ed1c24] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#ed1c24] animate-pulse" />
            {isAr ? "وجهتك الشاملة للعناية بالسيارات" : "ONE-STOP AUTO CARE"}
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-950 font-sans uppercase">
            {isAr ? "وجهتك الموثوقة " : "YOUR TRUSTED ONE-STOP "}
            <span className="text-[#ed1c24]">
              {isAr ? "للعناية بالمركبات" : "SHOP FOR AUTO CARE"}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 mt-2.5 leading-relaxed font-normal">
            {isAr
              ? "في تايرز وورلد، نقدم مجموعة متكاملة من إطارات السيارات والدراجات النارية والخدمات في جميع أنحاء الإمارات بأيدي فنيين محترفين وأحدث المعدات."
              : "At TyresWorld, we provide a wide range of car and motorcycle tyres across the UAE. Our experienced technicians use modern equipment and quality products to keep your vehicle safe and road-ready."}
          </p>
        </div>

        {/* ── Carousel Slider Wrapper ── */}
        <div className="relative group/slider">
          {/* Custom Navigation Buttons (Brand Red) */}
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label={isAr ? "السابق" : "Previous slide"}
            className={`absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-5 z-20 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c81018] text-white flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
              isBeginning ? "opacity-40 cursor-not-allowed" : "opacity-95 hover:opacity-100 hover:scale-105"
            }`}
          >
            {isAr ? <ChevronRight size={20} strokeWidth={2.4} /> : <ChevronLeft size={20} strokeWidth={2.4} />}
          </button>

          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label={isAr ? "التالي" : "Next slide"}
            className={`absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-5 z-20 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c81018] text-white flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
              isEnd ? "opacity-40 cursor-not-allowed" : "opacity-95 hover:opacity-100 hover:scale-105"
            }`}
          >
            {isAr ? <ChevronLeft size={20} strokeWidth={2.4} /> : <ChevronRight size={20} strokeWidth={2.4} />}
          </button>

          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            modules={[Navigation, Autoplay]}
            spaceBetween={18}
            slidesPerView={1.15}
            breakpoints={{
              540: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 2.5, spaceBetween: 18 },
              1024: { slidesPerView: 3.5, spaceBetween: 20 },
              1280: { slidesPerView: 4, spaceBetween: 20 },
            }}
            className="!pb-4 !px-1"
          >
            {AUTO_CARE_CATEGORIES.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <div className="ptr-sp-card h-full flex flex-col bg-white rounded-2xl border border-gray-200/90 hover:border-[#ed1c24]/50 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* ── Top Banner Image ── */}
                  <div className="relative h-40 sm:h-44 w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                    {/* Background Artwork */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.bannerBg}
                      alt={item.title}
                      className="ptr-sp-photo absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="ptr-sp-veil absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/35" />

                    {/* Bold Centered Banner Artwork Title */}
                    <div className="relative z-10 px-4 text-center max-w-[88%]">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wide leading-tight line-clamp-2 text-white drop-shadow-md">
                        {item.bannerTitle}
                      </span>
                    </div>

                    {/* Top Right: Badge Tag */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-[10.5px] font-bold px-2 py-0.5 rounded shadow-sm tracking-tight">
                        {isAr ? item.badgeAr : item.badge}
                      </span>
                    </div>

                    {/* Bottom Right: Verified Badge */}
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      <span className="bg-white/95 backdrop-blur-sm text-[#ed1c24] text-[10.5px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                        <CheckCircle2 size={12} className="text-[#ed1c24] stroke-[2.5]" />
                        {isAr ? "معتمد" : "Verified"}
                      </span>
                    </div>
                  </div>

                  {/* ── Circular Category Photo (Overlapping with Red Ring Border) ── */}
                  <div className="relative px-4 flex items-end -mt-8 z-20">
                    <div className="w-16 h-16 rounded-full border-2 border-white shadow-xl ring-2 ring-[#ed1c24] bg-zinc-900 overflow-hidden shrink-0 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center p-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.roundImg}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* ── Card Body Content ── */}
                  <div className="p-4 pt-3 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Category Title */}
                      <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 group-hover:text-[#ed1c24] transition-colors line-clamp-1 leading-snug">
                        <Link href={`/${locale}/${item.slug}`}>
                          {isAr ? item.titleAr : item.title}
                        </Link>
                      </h3>

                      {/* Description */}
                      <p className="text-[11.5px] text-gray-500 mt-2 line-clamp-2 leading-relaxed font-normal">
                        {isAr ? item.descriptionAr : item.description}
                      </p>
                    </div>

                    {/* Footer metadata & CTA */}
                    <div className="pt-3 mt-3 border-t border-gray-100">
                      {/* Key Feature Badge */}
                      <div className="text-[11px] text-gray-600 flex items-center gap-1.5 font-medium mb-3">
                        <ShieldCheck size={13} className="text-[#ed1c24] shrink-0" />
                        <span className="truncate">{isAr ? item.featureAr : item.feature}</span>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/${locale}/${item.slug}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 group-hover:bg-[#ed1c24] text-gray-800 group-hover:text-white text-xs font-bold transition-all duration-300 shadow-sm"
                      >
                        <span>{isAr ? item.ctaTextAr : item.ctaText}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
