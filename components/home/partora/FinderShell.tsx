"use client";

import React from "react";
import TyreFinder from "@/components/TyreFinder";
import {
  Truck,
  ShieldCheck,
  Zap,
  CreditCard,
  Sparkles,
} from "lucide-react";

interface FinderShellProps {
  locale: string;
  categoryUid?: string;
  basePath?: string;
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  showTrustFeatures?: boolean;
  className?: string;
}

export default function FinderShell({
  locale,
  categoryUid,
  basePath,
  title,
  titleAr,
  subtitle,
  subtitleAr,
  showTrustFeatures = true,
  className = "",
}: FinderShellProps) {
  const isAr = locale === "ar";

  const trustFeatures = [
    {
      icon: Truck,
      title: isAr ? "تركيب متنقل مجاني" : "Free Mobile Fitting",
      desc: isAr ? "عند باب منزلك أو بالمركز" : "At your doorstep or partner center",
    },
    {
      icon: ShieldCheck,
      title: isAr ? "إطارات أصلية 100%" : "100% Genuine Tyres",
      desc: isAr ? "ضمان رسمي من الوكيل" : "Official manufacturer warranty",
    },
    {
      icon: Zap,
      title: isAr ? "تركيب سريع بنفس اليوم" : "Same-Day Dispatch",
      desc: isAr ? "خدمة سريعة في جميع الإمارات" : "Fast express fitting across UAE",
    },
    {
      icon: CreditCard,
      title: isAr ? "تقسيط بدون فوائد" : "Pay in 4 Installments",
      desc: isAr ? "عبر تابي وتمارا" : "Via Tabby & Tamara",
    },
  ];

  return (
    <section id="ptr-hero-finder-section" className={`ptr-finder pt-1 pb-0 sm:pt-2 sm:pb-0 ${className}`}>
      <div className="ptr-container">
        {/* ── Outer Premium Hero Card ── */}
        <div id="ptr-hero-finder-card" className="relative rounded-3xl bg-gradient-to-b from-[#181617] via-[#141213] to-[#0d0c0d] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.35)] py-12 sm:py-14 lg:py-16 px-5 sm:px-7 lg:px-8 overflow-hidden">
          {/* Ambient Red Glow Background Effects */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-[#ed1c24]/15 blur-[120px] pointer-events-none rounded-full"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#ed1c24]/10 blur-[100px] pointer-events-none rounded-full"
            aria-hidden="true"
          />

          {/* ── Section Header with Glowing Pill ── */}
          <div className="relative z-10 text-center max-w-3xl mx-auto mb-6 sm:mb-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ed1c24]/15 border border-[#ed1c24]/40 text-[#ed1c24] text-[11px] font-bold uppercase tracking-widest mb-2.5 shadow-[0_0_15px_rgba(237,28,36,0.2)]">
              <Sparkles size={12} className="text-[#ed1c24] animate-pulse" />
              <span>{isAr ? "محدد الإطارات الذكي" : "SMART TYRE FINDER"}</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight font-sans leading-tight drop-shadow-sm">
              {isAr
                ? (titleAr ?? "ابحث عن الإطار المناسب لسيارتك")
                : (title ?? "Find The Perfect Tyres For Your Vehicle")}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] text-gray-300/90 mt-1.5 leading-relaxed max-w-2xl mx-auto font-normal">
              {isAr
                ? (subtitleAr ?? "ابحث حسب مقاس الإطار أو حسب نوع وموديل وسنة سيارتك مع ضمان التوافق 100% والتركيب المجاني في الإمارات.")
                : (subtitle ?? "Search by tyre size or select your car make, model & year with 100% fitment guarantee and free fitting across UAE.")}
            </p>
          </div>

          {/* ── Finder Form Slot ── */}
          <div className="relative z-10 ptr-finder-slot max-w-5xl mx-auto">
            <TyreFinder
              locale={locale}
              disableSticky={true}
              categoryUid={categoryUid}
              basePath={basePath}
            />
          </div>

          {/* ── Bottom 4 Trust Feature Badges ── */}
          {showTrustFeatures && (
            <div className="relative z-10 mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {trustFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-[#ed1c24]/40 hover:bg-white/[0.07] transition-all duration-300 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#ed1c24]/15 border border-[#ed1c24]/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#ed1c24] transition-all duration-300">
                      <Icon size={16} className="text-[#ed1c24] group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-[12.5px] font-bold text-white group-hover:text-[#ed1c24] transition-colors truncate">
                        {feat.title}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-gray-400 truncate mt-0.5">
                        {feat.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
