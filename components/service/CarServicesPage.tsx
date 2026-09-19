"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  image: string;
}

const CAR_SERVICES: ServiceItem[] = [
  {
    id: "tyre-service",
    slug: "car-tyre-service",
    title: "CAR TYRE SERVICE",
    titleAr: "خدمة إطارات السيارات",
    description:
      "Ensure optimal grip and safety with professional tyre care. Maximise performance with expert tyre inspections..",
    descriptionAr:
      "ضمان الثبات والأمان الأمثل مع خدمة الإطارات الاحترافية. عزز الأداء بفحص دقيق للإطارات..",
    image: "/images/services/best-tyre-fitting-service-shop-abu-dhabi.webp",
  },
  {
    id: "battery-service",
    slug: "car-battery-service",
    title: "CAR BATTERY SERVICE",
    titleAr: "خدمة بطاريات السيارات",
    description:
      "Power up your vehicle with reliable battery solutions. Get quick replacements and efficient diagnostics..",
    descriptionAr:
      "زوّد سيارتك بالطاقة مع حلول البطاريات الموثوقة. احصل على تبديل سريع وتشخيص دقيق..",
    image: "/images/services/car-battery-replacement-service-abu-dhabi.webp",
  },
  {
    id: "ac-service",
    slug: "car-ac-service",
    title: "CAR AC SERVICE",
    titleAr: "خدمة مكيف السيارات",
    description:
      "Keep your car cool and comfortable with expert AC services. Ensure clean air and optimal cooling performance..",
    descriptionAr:
      "حافظ على برودة وراحة سيارتك مع خدمات التكييف المتخصصة. هواء نقي وأداء تبريد مثالي..",
    image: "/images/services/expert-car-ac-service-workshop-near-me.webp",
  },
  {
    id: "brake-service",
    slug: "car-brake-service",
    title: "CAR BRAKE SERVICE",
    titleAr: "خدمة فرامل السيارات",
    description:
      "Drive confidently with brake inspections and repairs. Ensure safety with high-quality brake solutions..",
    descriptionAr:
      "قُد بثقة مع فحص وإصلاح الفرامل الاحترافي. نضمن سلامتك بأفضل قطع الفرامل الأصلية..",
    image: "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",
  },
  {
    id: "oil-change-service",
    slug: "car-oil-change-service",
    title: "CAR OIL CHANGE SERVICE",
    titleAr: "خدمة تغيير زيت السيارة",
    description:
      "Extend engine life with timely and efficient oil changes. Reduce friction and improve engine performance..",
    descriptionAr:
      "أطل عمر المحرك بتغيير الزيت في الوقت المناسب وبكفاءة عالية لتحسين أداء المحرك..",
    image: "/images/services/car-engine-oil-change-abu-dhabi.webp",
  },
  {
    id: "mechanical-service",
    slug: "car-mechanical-service",
    title: "CAR MECHANICAL SERVICE",
    titleAr: "خدمات الميكانيكا العامة",
    description:
      "Comprehensive mechanical solutions to keep your car running smoothly. From engine repairs to transmission fixes..",
    descriptionAr:
      "حلول ميكانيكية شاملة لتبقي سيارتك تعمل بأعلى كفاءة، من إصلاح المحركات إلى ناقل الحركة..",
    image: "/images/services/best-car-mechanical-services-abu-dhabi.webp",
  },
  {
    id: "wheel-alignment-service",
    slug: "car-wheel-alignment-service",
    title: "CAR WHEEL ALIGNMENT SERVICE",
    titleAr: "خدمة ميزان وتوجيه العجلات",
    description:
      "Enhance tyre life and performance with accurate wheel alignment. Prevent uneven wear and improve steering control..",
    descriptionAr:
      "عزز عمر الإطارات وأداء القيادة مع ميزان ليزر دقيق لمنع تآكل الإطارات وتحسين التوجيه..",
    image: "/images/services/benefits-regular-wheel-alignment-service-uae.webp",
  },
  {
    id: "wheel-balancing-service",
    slug: "car-wheel-balancing-service",
    title: "CAR WHEEL BALANCING SERVICE",
    titleAr: "خدمة ترصيص العجلات",
    description:
      "Achieve smoother rides with precision wheel balancing. Improve stability and eliminate vibrations..",
    descriptionAr:
      "احصل على قيادة أكثر سلاسة مع ترصيص العجلات الدقيق لتحسين الثبات ومنع الاهتزازات..",
    image: "/images/services/expert-car-wheel-balancing-service-abu-dhabi.webp",
  },
  {
    id: "rim-repair-service",
    slug: "car-rim-repair-service",
    title: "CAR RIM REPAIR SERVICE",
    titleAr: "خدمة تصليح جنوط السيارات",
    description:
      "Restore your rims to a flawless finish with expert repairs. Fix cracks, bends, and scratches with precision..",
    descriptionAr:
      "أعد رونق جنوط سيارتك مع إصلاح احترافي للكسور والانحناءات والخدوش بدقة متناهية..",
    image: "/images/services/car-rim-repair-service-abu-dhabi.webp",
  },
];

export default function CarServicesPage() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";

  return (
    <div className="bg-white pb-8 sm:pb-12" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Breadcrumb Bar ── */}
      <div className="bg-[#f4f4f5] border-b border-gray-200">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight size={12} className="text-gray-400 rtl:rotate-180" />
            <span className="text-gray-900 font-semibold">
              {isAr ? "خدمات السيارات" : "Car Services"}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Main Section ── */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Intro Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-gray-950 uppercase mb-3 font-sans">
            {isAr
              ? "تصليح وصيانة السيارات المتخصصة في أبوظبي"
              : "EXPERT CAR REPAIRS & SERVICES IN ABU DHABI"}
          </h1>

          <p className="text-xs sm:text-[13.5px] text-gray-700 leading-relaxed mb-3">
            {isAr ? (
              <>
                في{" "}
                <span className="text-[#ed1c24] font-bold">
                  Carolyn Auto Care – L.L.C – S.P.C
                </span>
                ، مركز الخدمة المعتمد لـ TyresWorld في أبوظبي، نفخر بتقديم أفضل خدمات تصليح وصيانة السيارات للحفاظ على سيارتك في أفضل حالاتها. مع فريق من الفنيين ذوي الخبرة والمعدات الحديثة والنهج المرتكز على العميل، نقدم مجموعة كاملة من حلول السيارات المصممة لتلبية جميع احتياجاتك.
              </>
            ) : (
              <>
                At{" "}
                <span className="text-[#ed1c24] font-bold">
                  Carolyn Auto Care – L.L.C – S.P.C
                </span>
                , the service hub of TyresWorld in Abu Dhabi, we take pride in delivering top-quality car repairs and maintenance to keep your vehicle in peak condition. With a team of experienced technicians, cutting-edge equipment, and a customer-focused approach, we provide a full range of automotive solutions designed to meet your every need.
              </>
            )}
          </p>

          <p className="text-xs sm:text-[13.5px] text-gray-700 leading-relaxed font-normal">
            {isAr
              ? "إليك نظرة عن قرب على الخدمات التي نقدمها لضمان أداء سيارتك الأمثل وسلامتك على الطريق:"
              : "Here’s a closer look at the services we offer to ensure your car performs optimally and keeps you safe on the road:"}
          </p>
        </div>

        {/* ── 3x3 Service Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {CAR_SERVICES.map((item) => (
            <div
              key={item.id}
              className="service-card-item bg-white rounded-lg border border-[#ed1c24] overflow-hidden flex flex-col hover:shadow-lg transition-all duration-200 group"
            >
              {/* Card Image with Red Tool Icon Badge */}
              <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={isAr ? item.titleAr : item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Top Left Red Icon Badge */}
                <div
                  className="absolute top-0 left-0 bg-[#ed1c24] text-white w-11 h-11 flex items-center justify-center shadow-md z-10"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-5 h-5 fill-white"
                  >
                    <path d="M64.7 34.6L160 107.9V160H107.9L34.6 64.7 64.7 34.6zM192 169.3c0-.4 0-.9 0-1.3V104c0-7.5-3.5-14.5-9.4-19L78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h64c.4 0 .9 0 1.3 0L271.2 293.9c-19.5 30-16.2 70.5 10.1 96.8l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-26.3-26.3-66.8-29.7-96.8-10.1L192 169.3zM304 304c17.7-17.7 46.3-17.7 64 0L480 416l-64 64L304 368c-17.7-17.7-17.7-46.3 0-64zM104 424a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zM23.2 376.8C8.3 391.7 0 411.8 0 432.8C0 476.5 35.5 512 79.2 512c21 0 41.1-8.3 56-23.2L238.5 385.5c-5.7-11.2-9.3-23.1-10.9-35.3L112.1 465.7c-8.7 8.7-20.6 13.6-32.9 13.6c-25.7 0-46.6-20.8-46.6-46.6c0-12.3 4.9-24.2 13.6-32.9L189.1 257l-23.1-23.1L23.2 376.8zM479.4 160c0 44.8-23.1 84.1-58 106.8l23.5 23.5c40.7-29 67.2-76.6 67.2-130.3c0-24.8-5.7-48.3-15.7-69.3c-4.4-9.2-16.5-10.5-23.7-3.3l-67.9 67.9c-3 3-7.1 4.7-11.3 4.7H368c-8.8 0-16-7.2-16-16V118.6c0-4.2 1.7-8.3 4.7-11.3l67.9-67.9c7.2-7.2 5.9-19.3-3.3-23.7C400.3 5.7 376.8 0 352 0C296.1 0 246.9 28.6 218.3 72.1l26 20C266.8 56.3 306.7 32.6 352 32.6c10.3 0 20.2 1.2 29.7 3.5L333.6 84.2c-9.1 9.1-14.2 21.5-14.2 34.4V144c0 26.9 21.8 48.6 48.6 48.6h25.4c12.9 0 25.3-5.1 34.4-14.2l48.1-48.1c2.3 9.5 3.5 19.5 3.5 29.7z" />
                  </svg>
                </div>
              </div>

              {/* Card Body Info */}
              <div className="p-5 sm:p-6 flex flex-col flex-1 bg-white">
                <h2 className="text-sm sm:text-base font-black uppercase text-gray-950 tracking-tight mb-2.5 group-hover:text-[#ed1c24] transition-colors font-sans">
                  <Link href={`/${locale}/${item.slug}`} className="hover:underline">
                    {isAr ? item.titleAr : item.title}
                  </Link>
                </h2>

                <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed flex-1">
                  {isAr ? item.descriptionAr : item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
