"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface AboutUsProps {
  locale?: string;
}

export default function AboutUs({ locale: localeProp }: AboutUsProps) {
  const pathname = usePathname();
  const locale = localeProp ?? (pathname?.split("/")[1] === "ar" ? "ar" : "en");
  const isAr = locale === "ar";

  return (
    <section className="section section-padding site-details bg-[#f4f4f4] py-14 lg:py-18 border-t border-b border-gray-200/60">
      <div className="container custom-width max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <div className="section-title mb-6 text-center">
          <h2 className="font-sans text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-2">
            {isAr ? "من " : "ABOUT "}
            <span className="text-[#ed1c24] theme_color">
              {isAr ? "نحن" : "US"}
            </span>
          </h2>
          <p className="font-sans text-black text-xs sm:text-[14px] font-bold tracking-tight m-0">
            <strong>
              {isAr
                ? "شريكك الموثوق للإطارات في الإمارات – أفضل الأسعار عبر الإنترنت"
                : "Your Trusted Tyre Partner in the UAE – Best Prices Online"}
            </strong>
          </p>
        </div>

        {/* Content Box */}
        <div className="text-content max-w-4xl mx-auto">
          <p className="text-[#222222] text-[12.5px] sm:text-[13.5px] leading-[1.8] font-normal m-0 text-left">
            {isAr
              ? "مرحباً بكم في TyresWorld، المتجر الرائد لشراء الإطارات عبر الإنترنت والمدعوم من DSP Trade Hub FZ-LLC، وهو اسم موثوق به يمتلك خبرة تمتد لأكثر من عقدين في قطاع السيارات بدولة الإمارات. بصفتنا موزعاً رئيسياً وتجار جملة للإطارات في المنطقة، نفخر بتقديم حلول إطارات متميزة مصممة لتلبية احتياجاتكم. في TyresWorld، نوفر مجموعة واسعة من أفضل ماركات الإطارات بأسعار تنافسية للغاية في الإمارات. مهمتنا هي ضمان رضا العملاء من خلال الخدمة الموثوقة والمشورة المتخصصة والمنتجات التي تضمن الأداء والمتانة."
              : "Welcome to TyresWorld, the premier online tyre shop powered by DSP Trade Hub FZ-LLC, a trusted name with over two decades of experience in the UAE automotive industry. As a leading tyre distributor and wholesaler in the region, we take pride in offering top-notch tyre solutions tailored to meet your needs. At TyresWorld, we provide an extensive range of premium tyre brands at the most competitive prices available online in the UAE. Our mission is to ensure customer satisfaction through reliable service, expert advice, and products that guarantee performance and durability."}
          </p>
        </div>
      </div>
    </section>
  );
}
