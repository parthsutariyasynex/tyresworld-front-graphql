"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle } from "lucide-react";
import { APP_CONFIG } from "@/src/config/app-config";

/* ─────────────────────────────────────────────────────────────────
   CAR BATTERY REPLACEMENT — real page content, not a placeholder
   Magento's CMS page for this URL (identifier car-battery-replacement)
   is authored as a custom .phtml block, not Page Builder HTML. The
   GraphQL cmsPage.content resolver can't render that block outside
   Magento's full layout pipeline and returns a raw PHP exception
   string as the entire "content" (see app/[locale]/[...slug]/page.tsx,
   isBrokenTemplateError) — there is no real markup retrievable through
   any GraphQL field for this page.
   The live PHP-rendered page at this same URL works fine, so this
   component transcribes ITS real, live copy and real image assets
   (proxied through /api/media, same pattern as the rest of the CMS
   branch) verbatim — nothing here is invented. Same reasoning as
   components/ev/EvTyresLanding.tsx for the EV Tyres CMS page, which
   has the identical broken-template problem.
───────────────────────────────────────────────────────────────── */

const media = (path: string) => `/api/media/${path}`;

const STEPS = [
  {
    icon: media("images/call-whatsup.png"),
    title: "Contact TyresWorld",
    body: "Call or message us on WhatsApp with your car details and location — our team will confirm everything and get moving.",
  },
  {
    icon: media("images/car-location.png"),
    title: "We Come To You",
    body: "A technician arrives at your location, wherever you are in the city, with the correct battery ready to fit.",
  },
  {
    icon: media("images/battery-replace-icon.png"),
    title: "Fitted, Tested, Ready To Drive",
    body: "We install the new battery and run a full check to confirm everything's working properly before we leave.",
  },
];

const VEHICLE_REPLACEMENT_POINTS = [
  "Genuine, brand-approved batteries matched to your vehicle",
  "The right battery for your car's make, model, and power needs",
  "Clean, properly connected terminals for reliable conductivity",
  "Secure fitting to prevent vibration damage on Abu Dhabi's roads",
  "A full system check once the new battery is installed",
];

const HEALTH_CHECK_POINTS = [
  "Catches a weak or failing battery early, before it fails",
  "Helps you avoid being stranded roadside",
  "Extends battery life despite Abu Dhabi's extreme heat",
  "Keeps your car's electrical system stable and reliable",
  "Means consistent, dependable starts every time",
];

const WHY_CHOOSE = [
  {
    title: "Certified Technicians, Every Time",
    body: "Our technicians are trained to manufacturer standards and experienced across 12V, AGM, EFB, auxiliary, and EV low-voltage batteries — for petrol, diesel, hybrid, luxury, and electric vehicles alike.",
    icon: (
      <svg className="w-8 h-8 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "The Right Battery, Properly Fitted",
    body: "We match the battery to your vehicle's make, model, year, and electrical load — so voltage stays stable and your electrical system is protected long-term, including for start-stop and EV models.",
    icon: (
      <svg className="w-8 h-8 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h-3v-3a1.5 1.5 0 00-1.5-1.5h-9A1.5 1.5 0 006 7.5v3H3A1.5 1.5 0 001.5 12v7.5A1.5 1.5 0 003 21h18a1.5 1.5 0 001.5-1.5V12a1.5 1.5 0 00-1.5-1.5zM9 13.5h6m-3-3v6" />
      </svg>
    ),
  },
  {
    title: "Clear Pricing, No Guesswork",
    body: "From testing to final fitting, you'll know exactly what's being done and what it costs upfront — honest assessments, no hidden charges.",
    icon: (
      <svg className="w-8 h-8 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
  {
    title: "Batteries Built To Last",
    body: "We only fit brand-approved batteries engineered to handle Abu Dhabi's heat, backed by manufacturer warranty for long-term peace of mind.",
    icon: (
      <svg className="w-8 h-8 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

const BRANDS = [
  { logo: media("images/amaron-battery.png"), name: "Amaron" },
  { logo: media("images/solite_1.jpg"), name: "Solite" },
  { logo: media("images/volcan_1.png"), name: "Volcan" },
  { logo: media("images/varta-battery.jpg"), name: "Varta" },
  { logo: media("images/bosch_1.png"), name: "Bosch" },
];

function whatsappHref(text: string) {
  return `https://wa.me/${APP_CONFIG.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

function WhatsAppButton({ text = "Hi TyresWorld, I'd like to book a car battery replacement in Abu Dhabi." }: { text?: string }) {
  return (
    <a
      href={whatsappHref(text)}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-slide-red inline-flex items-center gap-2.5 text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-lg shadow-md hover:shadow-lg uppercase tracking-wider cursor-pointer"
    >
      <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
      <span>WhatsApp Now!</span>
    </a>
  );
}

/* ── Quick Call Back form — dark theme card matching live site ───── */
function CallbackForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          telephone: phone,
          comment: "Quick call back request — Car Battery Replacement (Abu Dhabi).",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus({ ok: true, text: "Thanks — we'll call you back shortly." });
        setName(""); setPhone(""); setEmail("");
      } else {
        setStatus({ ok: false, text: data.error || "Couldn't send that. Please try WhatsApp instead." });
      }
    } catch {
      setStatus({ ok: false, text: "Network error — please try WhatsApp instead." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden bg-cover bg-center bg-no-repeat shadow-md flex flex-col justify-between"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.88), rgba(18, 18, 18, 0.92)), url("/YourTrustedAutoCare/car-battery.jpg")`,
      }}
    >
      <h3 className="text-sm font-black text-white mb-3 tracking-wide">Request a Quick Call Back</h3>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full bg-white border border-transparent rounded-md px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ed1c24]"
        />
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile Number"
          className="w-full bg-white border border-transparent rounded-md px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ed1c24]"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-white border border-transparent rounded-md px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ed1c24]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn-slide-red w-full text-white font-bold text-xs sm:text-sm py-2.5 rounded-md flex items-center justify-center gap-2 disabled:opacity-60 uppercase tracking-wider cursor-pointer"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? "Submitting..." : "Submit"}
        </button>
        {status && (
          <p className={`text-xs font-semibold ${status.ok ? "text-emerald-400" : "text-red-400"}`}>
            {status.text}
          </p>
        )}
      </form>
    </div>
  );
}

function ImageCard({
  title,
  body,
  bgImg,
  isDark = true,
  icon,
}: {
  title: string;
  body: string;
  bgImg: string;
  isDark?: boolean;
  icon?: string;
}) {
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden bg-cover bg-center bg-no-repeat shadow-md flex flex-col justify-end min-h-[210px]"
      style={{
        backgroundImage: isDark
          ? `linear-gradient(rgba(10, 10, 10, 0.75), rgba(10, 10, 10, 0.85)), url("${bgImg}")`
          : `linear-gradient(rgba(245, 245, 245, 0.82), rgba(245, 245, 245, 0.90)), url("${bgImg}")`,
      }}
    >
      {icon && <div className="mb-2 text-2xl">{icon}</div>}
      <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider mb-1.5 ${isDark ? "text-white" : "text-gray-900"}`}>
        {title}
      </h3>
      <p className={`text-[12px] sm:text-[13px] leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700 font-medium"}`}>
        {body}
      </p>
    </div>
  );
}

export default function CarBatteryReplacementLanding() {
  return (
    <div className="bg-white">
      {/* ── Intro: heading, copy, callback form ─────────────────── */}
      <section className="container py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-10 items-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight mb-3">
              Car Battery Replacement in Abu Dhabi{" "}
              <span className="text-[#ed1c24]">We Come To You</span>
            </h2>
            <p className="text-sm text-gray-700 font-semibold mb-5">
              Certified battery testing and replacement, built for Abu Dhabi&apos;s heat and daily driving.
            </p>

            <div className="space-y-4 text-[14px] text-gray-600 leading-relaxed mb-6">
              <p>
                Driving in Abu Dhabi puts real strain on a car battery — long hours parked under
                direct sun, short trips around the city, and one of the hottest climates a battery
                will ever have to work in. TyresWorld&apos;s mobile battery service covers petrol,
                diesel, hybrid, and electric vehicles, and comes to wherever you are in the city, so
                a flat battery doesn&apos;t have to mean a trip to a workshop.
              </p>
              <p>
                A typical 12V battery has a shorter working life here than in cooler climates,
                simply because of how much heat builds up under the bonnet. If you&apos;re noticing
                slower engine starts, dashboard warning lights, or flickering electronics, it&apos;s
                worth having your battery — or your vehicle&apos;s auxiliary or start-stop battery —
                checked before it fails completely and leaves you stranded on the road.
              </p>
              <p>
                Our technicians test your existing battery, check the alternator and charging
                system, and recommend the right replacement for your exact car — matched to its
                make, model, year, and electrical needs. We stock heat-resistant AGM, EFB, and
                conventional batteries suited to everything from everyday runabouts to luxury and
                electric vehicles, including BMW, Mercedes-Benz, Audi, Toyota, Lexus, and Tesla.
              </p>
            </div>

            <WhatsAppButton />
          </div>

          {/* Right side 2x2 grid matching live site design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CallbackForm />
            <ImageCard
              title="Trained, Trusted Technicians"
              body="Every battery is tested and fitted by a qualified specialist, not a quick swap."
              bgImg="/YourTrustedAutoCare/service-sample.jpg"
              isDark={false}
              icon="👨‍🔧"
            />
            <ImageCard
              title="No Hidden Costs"
              body="You'll know the price before we start. No surprise charges once the job is done."
              bgImg="/YourTrustedAutoCare/car-service-img.jpg"
              isDark={true}
              icon="🏷️"
            />
            <ImageCard
              title="Back on the Road Fast"
              body="Most replacements are done on-site within the hour."
              bgImg="/YourTrustedAutoCare/car-battery.jpg"
              isDark={true}
              icon="⏱️"
            />
          </div>
        </div>
      </section>

      {/* ── Dark strip with desert road background image ───────────── */}
      <div
        className="relative py-8 lg:py-10 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 15, 15, 0.72), rgba(15, 15, 15, 0.78)), url("/bg/desert-road-bg.jpg")`,
        }}
      >
        <p className="container text-center text-white font-black text-lg sm:text-xl lg:text-2xl tracking-wide uppercase">
          Mobile Car Battery Replacement, Wherever You Are In Abu Dhabi
        </p>
      </div>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="container py-12 lg:py-16 text-center">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">
          How Our Mobile Battery <span className="text-[#ed1c24]">Service Works</span>
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto mb-12">
          No workshop visit needed. Our technicians bring the battery, the tools, and the expertise
          straight to you, anywhere in Abu Dhabi.
        </p>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 items-start max-w-5xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative flex flex-col items-center group">
              {/* Card Box with Badge Number */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-2xl border border-gray-200/80 shadow-lg flex items-center justify-center p-4 mb-6 transition-transform duration-300 group-hover:-translate-y-1">
                <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-black text-gray-900 flex items-center justify-center">
                  0{i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.icon} alt="" className="w-14 h-14 object-contain" />
              </div>

              {/* Title & Red Accent Line */}
              <h3 className="text-base font-black text-gray-900 mb-2">
                {s.title}
                <span className="block w-8 h-0.5 bg-[#ed1c24] mx-auto mt-2 rounded-full" />
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed max-w-xs mx-auto">
                {s.body}
              </p>

              {/* Curved Connecting Arrows (Desktop) — Alternating flow: 01->02 (down), 02->03 (up) */}
              {i === 0 && (
                <div className="hidden md:block absolute top-10 -right-14 xl:-right-20 pointer-events-none z-10">
                  <svg className="w-24 lg:w-28 h-12 text-[#e86b6b]" viewBox="0 0 110 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M 5 12 C 35 42, 75 38, 98 16"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 87 12 L 100 16 L 93 27"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}

              {i === 1 && (
                <div className="hidden md:block absolute top-8 -right-14 xl:-right-20 pointer-events-none z-10">
                  <svg className="w-24 lg:w-28 h-12 text-[#e86b6b]" viewBox="0 0 110 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M 5 32 C 35 2, 75 6, 98 28"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 85 24 L 100 28 L 96 15"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Services (zig-zag) ───────────────────────────────────── */}
      <section className="w-full bg-[#f8f9fa] py-12 lg:py-16">
        <div className="w-full">
          <div className="text-center mb-12 container">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
              OUR BATTERY SERVICES <span className="text-[#ed1c24]">IN ABU DHABI</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-900 mt-1">Our Services</p>
          </div>

          <div className="space-y-0 mb-12">
            {/* Row 1: Vehicle Battery Replacement */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 items-stretch bg-white border-b border-gray-100 shadow-sm">
              <div className="relative min-h-[300px] lg:min-h-[450px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media("images/services/vehicle-battery-replacement-service-uae.webp")}
                  alt="Quick Vehicle Battery Replacement Service in UAE"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-8 lg:p-16 flex flex-col justify-center bg-[#f8f9fa] lg:bg-[#f8f9fa]">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-gray-900 mb-3">
                  VEHICLE BATTERY REPLACEMENT
                </h3>
                <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed mb-6">
                  A reliable battery is what gets your engine started and keeps your car&apos;s
                  electrical systems running smoothly. TyresWorld supplies and fits batteries for
                  petrol, diesel, hybrid, luxury, and electric vehicles across Abu Dhabi, with
                  technicians who follow strict fitting standards on every job — whether it&apos;s a
                  standard 12V, an AGM, an EFB, or an auxiliary battery.
                </p>
                <p className="text-xs font-bold text-gray-900 mb-3">
                  What&apos;s included with every installation:
                </p>
                <ul className="space-y-2.5">
                  {VEHICLE_REPLACEMENT_POINTS.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-gray-700">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-[#ed1c24] shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Row 2: Car Battery Health Check */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 items-stretch bg-white border-b border-gray-100 shadow-sm">
              <div className="p-8 lg:p-16 flex flex-col justify-center bg-[#f8f9fa] lg:bg-[#f8f9fa] order-2 lg:order-1">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-gray-900 mb-3">
                  CAR BATTERY HEALTH CHECK
                </h3>
                <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed mb-6">
                  Abu Dhabi&apos;s heat, combined with frequent short trips and heavy electrical loads,
                  wears batteries down faster than most drivers expect. Our battery health check
                  catches the early warning signs — weak voltage, poor cold-cranking performance, or a
                  struggling charging system — before they turn into a breakdown.
                </p>
                <p className="text-xs font-bold text-gray-900 mb-3">
                  Why it&apos;s worth doing:
                </p>
                <ul className="space-y-2.5">
                  {HEALTH_CHECK_POINTS.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-gray-700">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-[#ed1c24] shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative min-h-[300px] lg:min-h-[450px] order-1 lg:order-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media("images/services/car-battery-health-check-service-uae.webp")}
                  alt="Expert Car Battery Health Check in UAE"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="text-center pt-6">
            <WhatsAppButton />
          </div>
        </div>
      </section>

      {/* ── Why choose TyresWorld ─────────────────────────────────── */}
      <section className="container py-12 lg:py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">
          WHY CHOOSE TYRESWORLD <span className="text-[#ed1c24]">FOR BATTERY REPLACEMENT</span>
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 max-w-2xl mx-auto mb-10">
          Mobile battery replacement at your doorstep, anywhere in Abu Dhabi — done right the first time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-5xl mx-auto">
          {WHY_CHOOSE.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-100/90 rounded-xl p-6 shadow-md border-b-4 border-b-[#ed1c24] flex items-start gap-4 transition-transform duration-300 hover:-translate-y-0.5"
            >
              {f.icon}
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1.5 relative inline-block">
                  {f.title}
                  <span className="block w-6 h-0.5 bg-[#ed1c24] mt-1 rounded-full" />
                </h3>
                <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Battery brands ────────────────────────────────────────── */}
      <section className="bg-[#f8f9fa] py-12 lg:py-16 text-center">
        <div className="container">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900 mb-1">
            BATTERY BRANDS <span className="text-[#ed1c24]">WE TRUST</span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-gray-900 mb-4">
            Genuine brands, matched to your vehicle
          </p>
          <p className="text-xs sm:text-[13px] text-gray-600 max-w-4xl mx-auto mb-6 leading-relaxed">
            TyresWorld supplies brand-approved car batteries built for long life and heat resistance
            in Abu Dhabi&apos;s climate, covering petrol, diesel, hybrid, luxury, and electric
            vehicles. We stock 12V, AGM, EFB, and auxiliary batteries for Toyota, Nissan, Hyundai,
            Kia, BMW, Mercedes-Benz, Audi, Lexus, Tesla, and other EVs — each selected to
            manufacturer spec and backed by warranty and professional fitting.
          </p>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900 mb-8">
            BATTERY BRANDS
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            {BRANDS.map((b) => (
              <div
                key={b.name}
                className="bg-white border border-gray-200 rounded-xl h-16 w-36 flex items-center justify-center px-4 shadow-sm transition-transform hover:scale-105"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt={b.name} className="max-h-9 max-w-full object-contain" />
              </div>
            ))}
          </div>

          <Link
            href="/en/car-battery"
            className="btn-slide-red inline-flex items-center gap-2 text-white font-bold text-sm px-8 py-3 rounded-lg shadow-sm uppercase tracking-wider cursor-pointer"
          >
            Shop Car Battery
          </Link>
        </div>
      </section>
    </div>
  );
}
