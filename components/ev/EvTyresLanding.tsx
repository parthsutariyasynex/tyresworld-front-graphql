"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Check,
} from "lucide-react";
import PageHeroBanner from "@/components/PageHeroBanner";

export default function EvTyresLanding() {
  const pathname = usePathname();
  const locale = "en";

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  const FAQS = [
    {
      q: "Do electric cars need special tyres?",
      a: "Yes. EVs are heavier than petrol cars because of their battery packs, and they deliver power more suddenly. Standard tyres wear out faster under those conditions, so EV-specific tyres use reinforced construction and added noise reduction to handle the extra weight and torque comfortably.",
    },
    {
      q: "How do EV tyres help with battery range?",
      a: "EV tyres are built with low rolling resistance, meaning they require less energy to keep moving. That translates directly into better range per charge compared to a standard tyre.",
    },
    {
      q: "Can I use regular tyres on my electric car?",
      a: "You can, but it isn't ideal. Regular tyres tend to wear out faster on an EV due to the extra weight and torque, and you'll likely notice more road noise and slightly reduced range compared to an EV-specific tyre.",
    },
    {
      q: "How often should I get my EV tyres checked in Abu Dhabi?",
      a: "As a general guide, have your tyres inspected every 10,000 km or so, and always before a long trip out toward Al Ain or Dubai. Abu Dhabi's summer heat can accelerate wear, so regular checks help catch problems before they become safety issues.",
    },
    {
      q: "What should I check for when buying new EV tyres in Abu Dhabi?",
      a: "Look for the correct size for your vehicle, a load rating that matches your EV's weight, and features like low rolling resistance and noise reduction — these matter more for EVs than for petrol cars, especially given Abu Dhabi's heat.",
    },
    {
      q: "Are EV tyres quieter than regular tyres?",
      a: "Yes, generally. Most EV tyres include sound-dampening foam or acoustic layers specifically because road noise is much more noticeable in an EV's near-silent cabin.",
    },
  ];

  const EV_TYRES = [
    {
      brandLogo: "/images/ev/kumho-logo_1.png",
      brandName: "KUMHO",
      title: "KUMHO ECSTA PS71 EV",
      subtitle: "Everyday EV driving with a balance of performance, comfort, and efficient energy use",
      image: "/images/ev/ev-tyre-1.jpg",
      features: [
        "High-strength hybrid compound",
        "Low rolling resistance polymer blend",
        "K-Silent noise reduction",
      ],
      link: `/${locale}/tyres/brand/kumho?ev_tyre=EV`,
      buttonLabel: "SHOP KUMHO TYRE",
    },
    {
      brandLogo: "/images/ev/winrun.png",
      brandName: "WINRUN",
      title: "WINRUN R330 EV",
      subtitle: "Quiet, energy-efficient driving with dependable road response",
      image: "/images/ev/winrun-tyre.jpg",
      features: [
        "Wi-Silent noise reduction",
        "Optimized rolling efficiency structure",
        "Asymmetric grip pattern",
      ],
      link: `/${locale}/tyres/brand/winrun?ev_tyre=EV`,
      buttonLabel: "SHOP WINRUN TYRE",
    },
    {
      brandLogo: "/images/ev/pirelli-tyre-shop_1.png",
      brandName: "PIRELLI",
      title: "PIRELLI P ZERO PZ4",
      subtitle: "High-performance EVs that need sharp control and dynamic response",
      image: "/images/ev/ev-tyre-3.jpg",
      features: [
        "ELECT™ electric driving technology",
        "Noise-cancelling system (PNCS™)",
        "Seal-Inside puncture protection",
      ],
      link: `/${locale}/tyres/brand/pirelli?ev_tyre=EV`,
      buttonLabel: "SHOP PIRELLI TYRE",
    },
    {
      brandLogo: "/images/ev/michelin-tyres-shop_1.png",
      brandName: "MICHELIN",
      title: "MICHELIN PILOT SPORT EV",
      subtitle: "Drivers who want grip, efficiency, and ride comfort in one tyre",
      image: "/images/ev/ev-tyre-4.jpg",
      features: [
        "ElectricGrip compound",
        "Acoustic comfort technology",
        "Low rolling resistance design",
      ],
      link: `/${locale}/tyres/brand/michelin?ev_tyre=EV`,
      buttonLabel: "SHOP MICHELIN TYRE",
    },
  ];

  const POPULAR_CARS = [
    {
      name: "TESLA MODEL 3",
      image: "/images/ev/ev-tyre-5.jpg",
      desc: "Smooth daily driving with strong acceleration and reliable control",
      recommended: ["Michelin Pilot Sport EV", "Continental EcoContact 6", "Hankook iON evo"],
      link: `/${locale}/tyres/cars?make=tesla&model=model-3`,
      buttonLabel: "EXPLORE TESLA MODEL 3",
    },
    {
      name: "TESLA MODEL S",
      image: "/images/ev/ev-tyre-6.jpg",
      desc: "Powerful performance driving with premium comfort",
      recommended: ["Pirelli P Zero PZ4", "Michelin Pilot Sport 4", "Continental PremiumContact 6"],
      link: `/${locale}/tyres/cars?make=tesla&model=model-s`,
      buttonLabel: "EXPLORE TESLA MODEL S",
    },
    {
      name: "TESLA MODEL Y",
      image: "/images/ev/ev-tyre-7.jpg",
      desc: "Family and city driving with higher load capacity and a smooth ride",
      recommended: ["Pirelli Scorpion Zero", "Michelin Latitude Sport", "Continental CrossContact"],
      link: `/${locale}/tyres/cars?make=tesla&model=model-y`,
      buttonLabel: "EXPLORE TESLA MODEL Y",
    },
    {
      name: "VOLKSWAGEN ID.4",
      image: "/images/ev/ev-tyre-8.jpg",
      desc: "Balanced electric driving with reduced road noise and stable steering response.",
      recommended: ["Kumho Ecsta PS71", "Winrun R330", "Michelin e.Primacy"],
      link: `/${locale}/tyres/cars?make=volkswagen&model=id-4`,
      buttonLabel: "EXPLORE VOLKSWAGEN ID.4",
    },
  ];

  const PICK_BOXES = [
    { icon: "/images/ev/wather-icon.png", title: "Strong Grip" },
    { icon: "/images/ev/tire-control.png", title: "Confident Handling" },
    { icon: "/images/ev/performance-icon.png", title: "Consistent Performance" },
    { icon: "/images/ev/durability-icon.png", title: "Built to Last" },
    { icon: "/images/ev/energy-efficiency.png", title: "Better Energy Efficiency" },
    { icon: "/images/ev/low-noise.png", title: "A Quieter Ride" },
  ];

  return (
    <div dir="ltr" className="bg-white text-gray-900 font-sans">
      <PageHeroBanner
        title="Electric Vehicle Tyres in UAE"
        description="Shop premium EV tyres in UAE with free mobile fitting, manufacturer warranty, and best prices across Dubai, Abu Dhabi, and UAE."
        breadcrumb={[{ label: "Home", href: `/${locale}` }, { label: "EV Tyres" }]}
      />

      {/* ── 3. Top Content: Shop EV Tyres + Description + What Makes EV Ready ── */}
      <section className="pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-gray-100">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          {/* Main Centered Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-black uppercase tracking-tight text-gray-950 leading-tight">
              {"SHOP EV TYRES IN ABU DHABI "}
              <span className="text-[#ed1c24]">
                {"BUILT FOR ELECTRIC CARS & SUVS"}
              </span>
            </h2>
            <p className="text-xs sm:text-[13.5px] font-bold text-gray-900 mt-2 max-w-3xl mx-auto">
              {"Purpose-built tyres for better range, stronger grip, and a quieter ride, matched to Abu Dhabi's roads and climate."}
            </p>
          </div>

          {/* Intro Paragraphs */}
          <div className="max-w-6xl mx-auto text-xs sm:text-[12.5px] text-gray-700 leading-relaxed space-y-3 mb-10 text-start">
            <p>
              {"Electric vehicles are becoming a common sight across Abu Dhabi, from the daily commute along the Corniche to weekend runs out toward Al Ain or over to Dubai on the E11. Whatever you drive, your EV asks more of its tyres than a regular petrol car does — it needs instant grip, real heat resistance, and tyres that hold up mile after mile in Abu Dhabi's climate."}
            </p>
            <p>
              {"That's because EVs don't behave like combustion-engine cars. They accelerate faster, carry a heavier battery pack, and run near-silent — so a tyre built for a normal engine wears out faster, feels noisier, and holds the car back from performing the way it should. EV tyres are engineered around these differences, so your electric vehicle gets the range, comfort, and safety it was designed for, right here in Abu Dhabi."}
            </p>
          </div>

          {/* Block 1: What Makes a Tyre EV-Ready */}
          <div className="max-w-6xl mx-auto space-y-3 mb-8 text-start">
            <h3 className="text-xs sm:text-sm font-black uppercase text-gray-950 tracking-wide">
              {'WHAT MAKES A TYRE "EV-READY"?'}
            </h3>
            <p className="text-xs sm:text-[12px] text-gray-700 leading-relaxed">
              {"Every part of an EV tyre is built with electric driving in mind. Here's what that actually means for you behind the wheel:"}
            </p>

            <ul className="space-y-2.5 text-xs sm:text-[12px] text-gray-700 pl-4">
              <li className="list-disc">
                <strong className="text-gray-950 font-bold">{"Instant Torque Support — "}</strong>
                {"Reinforced tread patterns handle the sudden acceleration and stronger braking force unique to EVs, giving you a firmer grip from the first second you press the pedal."}
              </li>
              <li className="list-disc">
                <strong className="text-gray-950 font-bold">{"Heat-Resistant Compounds — "}</strong>
                {"Special tread materials resist heat buildup on hot Abu Dhabi asphalt, so traction holds up even during long, high-speed drives on roads like Sheikh Zayed Bin Sultan Street or the Al Ain highway."}
              </li>
              <li className="list-disc">
                <strong className="text-gray-950 font-bold">{"Low Rolling Resistance — "}</strong>
                {"EV tyres are engineered to roll more efficiently, helping you get more range out of every charge."}
              </li>
              <li className="list-disc">
                <strong className="text-gray-950 font-bold">{"Whisper-Quiet Cabin — "}</strong>
                {"Sound-dampening layers and noise-absorbing foam cut down on road noise — which you'll notice a lot more in a near-silent EV."}
              </li>
              <li className="list-disc">
                <strong className="text-gray-950 font-bold">{"Higher Load Rating — "}</strong>
                {"Built to carry the extra weight of an EV's battery pack without breaking down the tread early."}
              </li>
            </ul>

            <p className="text-xs sm:text-[12px] text-gray-600 pt-1">
              {"Together, these features add up to steadier handling, less tyre wear, and a smoother ride even when you're pushing your EV hard."}
            </p>
          </div>

          {/* Block 2: Made for Abu Dhabi Heat */}
          <div className="max-w-6xl mx-auto space-y-2.5 text-start">
            <h3 className="text-xs sm:text-sm font-black uppercase text-gray-950 tracking-wide">
              {"MADE FOR ABU DHABI HEAT, HIGHWAYS, AND EVERYDAY DRIVING"}
            </h3>
            <p className="text-xs sm:text-[12px] text-gray-700 leading-relaxed">
              {"Abu Dhabi's roads are tougher on tyres than most. Between extreme summer heat, humidity along the coast and Corniche, and long, fast stretches of highway like the E11 and E10, a standard tyre wears out faster here than it would elsewhere. That's why EV tyres at TyresWorld are made with heat-resistant compounds that reduce overheating, hold their grip, and slow down the wear that Abu Dhabi's climate usually causes."}
            </p>
            <p className="text-xs sm:text-[12px] text-gray-700 leading-relaxed">
              {"Whether you're commuting between Khalifa City and downtown, driving out to Yas Island or Saadiyat, or taking a longer trip toward Al Ain, having the right tyre matters. At TyresWorld, we stock trusted EV tyre brands, back every purchase with expert advice, and can help with fitting, balancing, and wheel alignment anywhere across Abu Dhabi."}
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Top EV Tyre Brands Available in Abu Dhabi (Exact Card Design) ── */}
      <section className="py-12 sm:py-16 bg-[#fbfbfb] border-b border-gray-200">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black uppercase text-gray-950 tracking-tight leading-tight">
              {"TOP EV TYRE BRANDS "}
              <span className="text-[#ed1c24]">
                {"AVAILABLE IN ABU DHABI"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-900 mt-1.5">
              {"Trusted tyre technology, engineered for quieter, smarter electric driving"}
            </p>
            <p className="text-xs sm:text-[12.5px] text-gray-600 mt-2 max-w-4xl mx-auto leading-relaxed">
              {"TyresWorld stocks EV tyres from some of the most trusted names in the industry — brands built for instant torque, added battery weight, and Abu Dhabi's road conditions, without compromising on comfort or safety. Below is a selection to get you started; our team can help you match the right one to your exact vehicle and arrange fitting anywhere in the city."}
            </p>
          </div>

          {/* Subheading: Browse by Brand */}
          <div className="max-w-6xl mx-auto mb-6">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-gray-950 text-start">
              {"BROWSE EV-COMPATIBLE TYRES BY BRAND"}
            </h3>
          </div>

          {/* 4 Brand Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-8">
            {EV_TYRES.map((t) => (
              <div
                key={t.title}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Grey Header with Centered Logo & Mesh Background */}
                  <div className="bg-[#f0f2f5] py-4 px-3 text-center border-b border-gray-100 flex items-center justify-center h-12">
                    <img src={t.brandLogo} alt={t.brandName} className="max-h-6 max-w-[120px] object-contain" />
                  </div>

                  {/* Big Angled Tyre Image */}
                  <div className="bg-[#f8f9fa] p-4 flex items-center justify-center h-48 sm:h-52">
                    <img
                      src={t.image}
                      alt={t.title}
                      className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Card White Body Content */}
                  <div className="p-4 text-start">
                    <h4 className="text-xs sm:text-[13px] font-black uppercase text-gray-950 tracking-tight leading-snug">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-gray-600 mt-1 mb-3.5 leading-snug min-h-[32px]">
                      {t.subtitle}
                    </p>

                    {/* Features checklist with red ticks */}
                    <ul className="space-y-1.5 text-[11px] text-gray-800 font-medium mb-2">
                      {t.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-1.5">
                          <Check size={12} className="text-[#ed1c24] stroke-[3] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Solid Red Shop Button */}
                <Link
                  href={t.link}
                  className="btn-cta w-full text-xs py-2.5 px-4"
                >
                  <span>{t.buttonLabel}</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Centered Black Pill Button */}
          <div className="text-center">
            <Link
              href={`/${locale}/tyres?ev_tyre=EV`}
              className="btn-cta text-xs font-bold px-7 py-2.5 rounded-full shadow-xs"
            >
              <span>{"Browse All EV Tyres"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Popular Electric Cars in Abu Dhabi (Matching Card Design) ── */}
      <section className="py-12 sm:py-16 border-b border-gray-200">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black uppercase text-gray-950 tracking-tight leading-tight">
              {"POPULAR ELECTRIC CARS "}
              <span className="text-[#ed1c24]">
                {"IN ABU DHABI"}
              </span>
            </h2>
            <p className="text-xs sm:text-[12.5px] text-gray-600 mt-2 max-w-4xl mx-auto leading-relaxed">
              {"Electric vehicles are becoming a familiar sight across Abu Dhabi, and each model has its own tyre needs based on weight, power, and driving style. Here's a quick guide to some of the most popular EVs on Abu Dhabi roads and the tyres we'd recommend for each."}
            </p>
          </div>

          {/* 4 Car Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-8">
            {POPULAR_CARS.map((car) => (
              <div
                key={car.name}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Car Image Area */}
                  <div className="bg-[#f8f9fa] p-4 flex items-center justify-center h-48 sm:h-52 border-b border-gray-100">
                    <img
                      src={car.image}
                      alt={car.name}
                      className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-4 text-start">
                    <h4 className="text-xs sm:text-[13px] font-black uppercase text-gray-950 tracking-tight leading-snug">
                      {car.name}
                    </h4>
                    <p className="text-[11px] text-gray-600 mt-1 mb-3.5 leading-snug min-h-[32px]">
                      {car.desc}
                    </p>

                    {/* Recommended tyres list with red ticks */}
                    <ul className="space-y-1.5 text-[11px] text-gray-800 font-medium mb-2">
                      {car.recommended.map((rec) => (
                        <li key={rec} className="flex items-center gap-1.5">
                          <Check size={12} className="text-[#ed1c24] stroke-[3] shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Solid Red Explore Button */}
                <Link
                  href={car.link}
                  className="btn-cta w-full text-xs py-2.5 px-4"
                >
                  <span>{car.buttonLabel}</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Centered Black Pill Button */}
          <div className="text-center">
            <Link
              href={`/${locale}/tyres/cars`}
              className="btn-cta text-xs font-bold px-7 py-2.5 rounded-full shadow-xs"
            >
              <span>{"Browse All Car Models"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Why Choose TyresWorld for Your EV Tyres in Abu Dhabi ── */}
      <section className="py-12 sm:py-16 bg-[#fbfbfb] border-b border-gray-200">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black uppercase text-gray-950 tracking-tight leading-tight">
              {"WHY CHOOSE TYRESWORLD FOR YOUR EV TYRES "}
              <span className="text-[#ed1c24]">
                {"IN ABU DHABI"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-900 mt-2">
              {"Genuine EV tyres, expert fitting, and support you can rely on"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="bg-white rounded-xl border border-gray-200 border-b-4 border-b-[#ed1c24] p-6 sm:p-8 shadow-xs text-center flex flex-col items-center justify-between">
              <div>
                <div className="h-14 flex items-center justify-center mb-4">
                  <img
                    src="/images/ev/ev-tyres-icon.png"
                    alt="A Full Range of EV Tyres"
                    className="max-h-12 w-auto object-contain"
                  />
                </div>
                <h4 className="text-xs sm:text-[13.5px] font-black uppercase text-gray-950 tracking-wide mb-2.5">
                  {"A FULL RANGE OF EV TYRES"}
                </h4>
                <p className="text-[11.5px] text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {"From daily-commute models to high-performance EVs, we stock tyres for every major electric vehicle on Abu Dhabi's roads."}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl border border-gray-200 border-b-4 border-b-[#ed1c24] p-6 sm:p-8 shadow-xs text-center flex flex-col items-center justify-between">
              <div>
                <div className="h-14 flex items-center justify-center mb-4">
                  <img
                    src="/images/ev/mobile-van-icon.png"
                    alt="Installation Wherever You Are"
                    className="max-h-12 w-auto object-contain"
                  />
                </div>
                <h4 className="text-xs sm:text-[13.5px] font-black uppercase text-gray-950 tracking-wide mb-2.5">
                  {"INSTALLATION WHEREVER YOU ARE"}
                </h4>
                <p className="text-[11.5px] text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {"Our mobile fitting service comes to you, anywhere in Abu Dhabi — from Khalifa City to Yas Island — so you don't have to work around a workshop's schedule."}
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl border border-gray-200 border-b-4 border-b-[#ed1c24] p-6 sm:p-8 shadow-xs text-center flex flex-col items-center justify-between">
              <div>
                <div className="h-14 flex items-center justify-center mb-4">
                  <img
                    src="/images/ev/tire-installation.png"
                    alt="Fitted by Experienced Technicians"
                    className="max-h-12 w-auto object-contain"
                  />
                </div>
                <h4 className="text-xs sm:text-[13.5px] font-black uppercase text-gray-950 tracking-wide mb-2.5">
                  {"FITTED BY EXPERIENCED TECHNICIANS"}
                </h4>
                <p className="text-[11.5px] text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {"Every tyre is fitted, balanced, and aligned by trained specialists, so you get accurate, safe results every time."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Decode Your EV's Tyre Size ── */}
      <section className="py-12 sm:py-16 border-b border-gray-200">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black uppercase text-gray-950 tracking-tight leading-tight">
              {"DECODE YOUR "}
              <span className="text-[#ed1c24]">
                {"EV'S TYRE SIZE"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1.5">
              {"Get the size right and you'll notice the difference in handling, comfort, and efficiency."}
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs overflow-hidden">
            <img
              src="/images/ev/tyre-size-guide-chart-new.webp"
              alt="EV Tyre Size Guide"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* ── 8. What to Look for When Choosing EV Tyres (6 Pill-shaped Boxes) ── */}
      <section className="py-12 sm:py-16 bg-[#fbfbfb] border-b border-gray-200">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black uppercase text-gray-950 tracking-tight leading-tight">
              {"WHAT TO LOOK FOR "}
              <span className="text-[#ed1c24]">
                {"WHEN CHOOSING EV TYRES"}
              </span>
            </h2>
            <p className="text-xs sm:text-[13px] font-bold text-gray-900 mt-2 max-w-2xl mx-auto">
              {"The right tyre comes down to your driving habits, the roads you cover, and Abu Dhabi's climate."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PICK_BOXES.map((box) => (
              <div
                key={box.title}
                className="bg-white rounded-full border border-gray-200/90 shadow-[0_3px_12px_rgba(0,0,0,0.06)] hover:shadow-md transition-all p-3 sm:px-5 flex items-center gap-4"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#e8f2fc] flex items-center justify-center p-2.5 shrink-0">
                  <img src={box.icon} alt={box.title} className="w-full h-full object-contain" />
                </div>
                <div className="text-start">
                  <h4 className="text-xs sm:text-[13.5px] font-black text-gray-950 leading-snug">
                    {box.title}
                  </h4>
                  <div className="w-7 h-[2.5px] bg-[#ed1c24] mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Frequently Asked Questions (Accordion) ── */}
      <section className="py-12 sm:py-16 border-b border-gray-200">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black uppercase text-gray-950 tracking-tight leading-tight">
              {"FREQUENTLY ASKED QUESTIONS "}
              <span className="text-[#ed1c24]">
                {"ABOUT EV TYRES IN ABU DHABI"}
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-start px-5 py-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-gray-900 hover:text-[#ed1c24] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#ed1c24]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-200 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-[13px] text-gray-600 leading-relaxed border-t border-gray-50">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
