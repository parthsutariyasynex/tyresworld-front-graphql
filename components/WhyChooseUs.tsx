"use client";

import React from "react";

interface WhyChooseUsProps {
  locale?: string;
}

/* ── Reason icon — the theme's badge PNG, recoloured red ──────────────
   Mirrors the Magento markup exactly: the icon art lives in a single PNG
   (public/images/home/why-reason-icon.png); the SVG feFlood + feComposite
   pair floods that shape with brand red, so the alpha silhouette becomes a
   solid red glyph. Each instance needs its own filter/image ids. */
const ReasonIcon = ({ uid }: { uid: string }) => (
  <svg
    viewBox="0 0 512 458"
    className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 mt-0.5"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <image
        width="512"
        height="458"
        id={`why-img-${uid}`}
        href="/images/home/why-reason-icon.png"
      />
      <filter id={`why-recolor-${uid}`}>
        <feFlood floodColor="#ed1c24" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </defs>
    <use href={`#why-img-${uid}`} x="0" y="0" filter={`url(#why-recolor-${uid})`} />
  </svg>
);

export default function WhyChooseUs({ locale = "en" }: WhyChooseUsProps) {
  const isAr = locale === "ar";

  const leftColumn = [
    {
      title: isAr ? "أفضل الأسعار على الإطارات" : "Best Prices on Tyres",
      desc: isAr
        ? "اشترِ الإطارات عبر الإنترنت بأسعار تنافس صالات العرض، دون التنازل عن الجودة."
        : "Buy tyres online at prices that beat the showroom, without giving up on quality.",
    },
    {
      title: isAr ? "إطارات تناسب كل سيارة" : "Tyres for Every Vehicle",
      desc: isAr
        ? "سيارات سيدان، دفع رباعي أو 4x4 — اعثر على المقاس المناسب والماركة في ثوانٍ."
        : "Car, SUV, or 4x4 — find the right tyre size and brand for your vehicle in seconds.",
    },
    {
      title: isAr ? "تركيب سهل للإطارات بالقرب منك" : "Easy Tyre Fitting Near You",
      desc: isAr
        ? "احجز تركيب الإطارات في مركز معتمد قريب منك أو عند باب منزلك."
        : "Book tyre fitting at a trusted centre near you, or get it done right at your doorstep.",
    },
  ];

  const rightColumn = [
    {
      title: isAr ? "توصيل مجاني للإطارات في الإمارات" : "Free Tyre Delivery in the UAE",
      desc: isAr
        ? "اطلب 4 إطارات أو أكثر واحصل على توصيل مجاني إلى أي مكان في الإمارات."
        : "Order 4 or more tyres and get free delivery anywhere in the UAE.",
    },
    {
      title: isAr ? "تسوق آمن ومحمي عبر الإنترنت" : "Safe and Secure Online Shopping",
      desc: isAr
        ? "اشترِ الإطارات بثقة — موقعنا مشفر بالكامل لحماية بيانات الدفع الخاصة بك."
        : "Buy tyres online with confidence — our site is fully encrypted to protect your payment details.",
    },
    {
      title: isAr ? "متجر إطارات إلكتروني موثوق" : "A Trusted Online Tyre Shop",
      desc: isAr
        ? "نحن موزع إطارات معتمد عبر الإنترنت في الإمارات، يثق بنا السائقون في جميع أنحاء الدولة."
        : "We're an authorised online tyre reseller in the UAE, trusted by drivers across the country.",
    },
  ];

  return (
    <section className="section section-padding why-you-should bg-black py-16 lg:py-20 border-t border-white/10">
      <div className="container custom-width max-w-7xl mx-auto px-4">
        {/* Section Title */}
        <div className="section-title mb-12 text-center heading-styel1 title-span-block">
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-wider text-white m-0">
            {isAr ? "أهم الأسباب " : "TOP REASONS TO "}
            <span className="text-[#ed1c24] theme_color">
              {isAr ? "لشراء الإطارات أونلاين" : "BUY ONLINE TYRES"}
            </span>
          </h2>
        </div>

        {/* 2 Columns List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {/* Left Column */}
          <div className="content-list">
            <ul className="list-none space-y-7 p-0 m-0">
              {leftColumn.map((item, i) => (
                <li key={item.title} className="flex items-start gap-4">
                  <div className="icon shrink-0">
                    <ReasonIcon uid={`l${i}`} />
                  </div>
                  <div className="text flex-1">
                    <p className="text-white/85 text-[15px] sm:text-[16px] leading-relaxed m-0 font-normal">
                      <b className="font-bold text-white block text-[16px] sm:text-[17px] mb-1">
                        {item.title}
                      </b>
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column */}
          <div className="content-list">
            <ul className="list-none space-y-7 p-0 m-0">
              {rightColumn.map((item, i) => (
                <li key={item.title} className="flex items-start gap-4">
                  <div className="icon shrink-0">
                    <ReasonIcon uid={`r${i}`} />
                  </div>
                  <div className="text flex-1">
                    <p className="text-white/85 text-[15px] sm:text-[16px] leading-relaxed m-0 font-normal">
                      <b className="font-bold text-white block text-[16px] sm:text-[17px] mb-1">
                        {item.title}
                      </b>
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
