"use client";

import React from "react";

interface HowItWorksProps {
  locale?: string;
}

export default function HowItWorks({ locale = "en" }: HowItWorksProps) {
  const isAr = locale === "ar";

  const steps = [
    {
      number: "01",
      img: "/media/images/find-your-tyres.webp",
      alt: isAr ? "ابحث عن إطاراتك" : "Find Your Tyres",
      title: isAr ? "ابحث عن إطاراتك" : "Find Your Tyres",
      desc: isAr
        ? "استكشف إطارات عالية الجودة من أفضل الماركات المصممة لسيارتك."
        : "Explore high-quality tyres from top brands designed for your vehicle.",
    },
    {
      number: "02",
      img: "/media/images/set-up-installation.webp",
      alt: isAr ? "حدد موعد التركيب" : "Set Up Installation",
      title: isAr ? "حدد موعد التركيب" : "Set Up Installation",
      desc: isAr
        ? "اختر الوقت والموقع المناسبين للتركيب من شبكة مراكزنا المعتمدة."
        : "Pick a time and location for installation from our expert network of installers.",
    },
    {
      number: "03",
      img: "/media/images/secure-payment-quick-install.webp",
      alt: isAr ? "دفع آمن وتركيب سريع" : "Secure Payment, Quick Install",
      title: isAr ? "دفع آمن، وتركيب سريع" : "Secure Payment, Quick Install",
      desc: isAr
        ? "ادفع عبر الإنترنت بأمان واستمتع بتركيب سهل للإطارات في موقعك المختار."
        : "Pay online securely and enjoy easy tyre fitting at your chosen location.",
    },
  ];

  return (
    <section className="section section-padding how-works bg-black py-16 lg:py-20">
      <div className="container custom-width max-w-7xl mx-auto px-4">
        <div className="section-title mb-10 text-center heading-styel1">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white m-0">
            {isAr ? "كيف يعمل " : "HOW TYRESWORLD.AE "}
            <span className="text-[#ed1c24] theme_color">
              {isAr ? "TYRESWORLD.AE" : "WORKS"}
            </span>
          </h2>
        </div>

        <div className="steps">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 sm:gap-8 lg:gap-10">
            {steps.map((step, idx) => (
              <div
                key={step.number}
                className={`box step${idx + 1} flex flex-col items-center text-center group`}
              >
                <div className="icon relative w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                  <span className="number absolute left-0 top-0 z-10 w-[30px] h-[30px] bg-[#ed1c24] text-white rounded-full text-xs font-bold flex items-center justify-center border-2 border-black shadow-md">
                    {step.number}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step.img}
                    alt={step.alt}
                    className="w-full h-full object-cover rounded-full border-[5px] border-[#232323] transition-all duration-300 group-hover:border-[#ed1c24] group-hover:shadow-[0_0_0_5px_rgba(237,28,36,0.25)]"
                    loading="lazy"
                  />
                </div>
                <div className="text-block mt-5 max-w-xs">
                  <h4 className="text-white text-lg sm:text-xl font-bold capitalize mb-2 transition-colors duration-300 group-hover:text-[#ed1c24]">
                    {step.title}
                  </h4>
                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed font-normal m-0">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
