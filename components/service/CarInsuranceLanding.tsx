"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, ShieldCheck, FileText, PhoneCall, Award, Car, Clock, Zap } from "lucide-react";
import { APP_CONFIG } from "@/src/config/app-config";

function whatsappHref(text: string) {
  return `https://wa.me/${APP_CONFIG.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

function WhatsAppButton({ text = "Hi TyresWorld, I'd like to get a car insurance quote in UAE." }: { text?: string }) {
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
      <span>WhatsApp Advisor</span>
    </a>
  );
}

/* ── Insurance Quote Request Form ────────────────────────────── */
function CallbackForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("Sedan / SUV");
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
          comment: `Car Insurance Quote Request (${vehicleType}) — UAE.`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus({ ok: true, text: "Thanks — our insurance advisor will contact you shortly." });
        setName(""); setPhone(""); setEmail("");
      } else {
        setStatus({ ok: false, text: data.error || "Couldn't send request. Please try WhatsApp." });
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
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.90), rgba(18, 18, 18, 0.94)), url("/images/bg/car-insurance-banner.png")`,
      }}
    >
      <h3 className="text-sm font-black text-white mb-3 tracking-wide">Request Insurance Quote</h3>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="w-full bg-white border border-transparent rounded-md px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ed1c24]"
        />
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile Number (+971...)"
          className="w-full bg-white border border-transparent rounded-md px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ed1c24]"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="w-full bg-white border border-transparent rounded-md px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ed1c24]"
        />
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="w-full bg-white border border-transparent rounded-md px-3.5 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ed1c24]"
        >
          <option value="Sedan / Hatchback">Sedan / Hatchback</option>
          <option value="SUV / 4x4">SUV / 4x4</option>
          <option value="Luxury / Sports Car">Luxury / Sports Car</option>
          <option value="Electric Vehicle (EV)">Electric Vehicle (EV)</option>
          <option value="Motorcycle / Motorbike">Motorcycle / Motorbike</option>
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="btn-slide-red w-full text-white font-bold text-xs sm:text-sm py-2.5 rounded-md flex items-center justify-center gap-2 disabled:opacity-60 uppercase tracking-wider cursor-pointer mt-1"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? "Submitting..." : "Get Quotes Now"}
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

const STEPS = [
  {
    icon: "/icons/vehicle-car.png",
    title: "Submit Vehicle Details",
    body: "Enter your car make, model, year, and estimated value to receive instant tailored quotes.",
  },
  {
    icon: "/car-service-icon.png",
    title: "Compare Top Quotes",
    body: "Review best-rate comprehensive and third-party plans from leading licensed UAE insurance providers.",
  },
  {
    icon: "/car-battery-icons.png",
    title: "Instant Digital Policy",
    body: "Pay securely online and receive your official insurance policy document instantly via email and WhatsApp.",
  },
];

const COVERAGE_FEATURES = [
  {
    title: "Comprehensive Car Insurance",
    body: "Full protection covering accidental damage, collision, fire, theft, vandalism, storm, and natural disaster repair expenses across UAE.",
    icon: (
      <svg className="w-8 h-8 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
  {
    title: "Third-Party Liability (TPL)",
    body: "Mandatory UAE legal coverage protecting against third-party bodily injury, medical costs, and third-party vehicle property damage.",
    icon: (
      <svg className="w-8 h-8 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    title: "EV & Hybrid Vehicle Coverage",
    body: "Tailored insurance packages covering high-voltage lithium battery packs, charging cables, home charging stations, and specialized software.",
    icon: (
      <svg className="w-8 h-8 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Agency Repair & Roadside Help",
    body: "Guaranteed repairs at official brand dealership agency workshops using genuine OEM parts, plus 24/7 free breakdown towing & jumpstarts.",
    icon: (
      <svg className="w-8 h-8 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h2.25" />
      </svg>
    ),
  },
];

export default function CarInsuranceLanding() {
  return (
    <div className="bg-white">
      {/* ── Intro: heading, copy, callback form ─────────────────── */}
      <section className="container py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-10 items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight mb-3">
              SHOP AFFORDABLE CAR INSURANCE PLANS{" "}
              <span className="text-[#ed1c24]">IN UAE</span>
            </h1>
            <p className="text-sm text-gray-700 font-semibold mb-5">
              Compare comprehensive & third-party car insurance quotes instantly from UAE&apos;s leading insurance providers.
            </p>

            <div className="space-y-4 text-[14px] text-gray-600 leading-relaxed mb-6">
              <p>
                Driving in the UAE requires mandatory valid car insurance coverage. TyresWorld helps
                you compare best-rate comprehensive, third-party liability, and customized add-on
                coverage plans for personal, luxury, commercial, and electric vehicles across Dubai,
                Abu Dhabi, and all UAE emirates.
              </p>
              <p>
                Whether you need annual policy renewals, vehicle registration insurance certificates for RTA or TAMM,
                or premium agency repair options with zero excess, our licensed insurance partners offer
                instant online quotes with seamless digital policy issuance.
              </p>
              <p>
                Enjoy complete peace of mind with 24/7 emergency roadside assistance, off-road 4x4 coverage,
                GCC country extensions, personal accident protection for driver & passengers, and hassle-free
                claims processing handled by dedicated specialists.
              </p>
            </div>

            <WhatsAppButton />
          </div>

          {/* Right side 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CallbackForm />
            <ImageCard
              title="Best Rate Guarantee"
              body="Lowest price quotes guaranteed across top licensed UAE insurance providers."
              bgImg="/YourTrustedAutoCare/car-service-img.jpg"
              isDark={true}
              icon="💰"
            />
            <ImageCard
              title="Instant Policy Issuance"
              body="Digital insurance policy issued instantly and sent directly to RTA/TAMM systems."
              bgImg="/YourTrustedAutoCare/service-sample.jpg"
              isDark={false}
              icon="⚡"
            />
            <ImageCard
              title="24/7 Roadside Assistance"
              body="Free towing, battery jumpstart, tire change, and emergency assistance included."
              bgImg="/YourTrustedAutoCare/car-battery.jpg"
              isDark={true}
              icon="🛡️"
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
          COMPREHENSIVE & THIRD-PARTY CAR INSURANCE COVERAGE ACROSS UAE
        </p>
      </div>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="container py-12 lg:py-16 text-center">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">
          HOW OUR CAR INSURANCE <span className="text-[#ed1c24]">PROCESS WORKS</span>
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto mb-12">
          Get covered in 3 quick steps with instant online comparison and digital policy delivery.
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

              {/* Curved Connecting Arrows (Desktop) */}
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

      {/* ── Why choose TyresWorld Insurance ────────────────────────── */}
      <section className="container py-12 lg:py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">
          WHY CHOOSE TYRESWORLD <span className="text-[#ed1c24]">FOR CAR INSURANCE</span>
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 max-w-2xl mx-auto mb-10">
          Trusted coverage, zero hidden fees, and dedicated claims support across all UAE emirates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-5xl mx-auto">
          {COVERAGE_FEATURES.map((f) => (
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

      {/* ── Call to action footer ─────────────────────────────────── */}
      <section className="bg-[#f8f9fa] py-12 lg:py-16 text-center">
        <div className="container">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">
            GET INSURED & DRIVE WITH <span className="text-[#ed1c24]">CONFIDENCE</span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-gray-900 mb-6">
            Instant Quotes • Agency Repair Options • Seamless Registration Renewal
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <WhatsAppButton text="Hi TyresWorld, I need an instant car insurance quote for my vehicle." />
            <Link
              href="/en/contact"
              className="btn-slide-red inline-flex items-center gap-2 text-white font-bold text-sm px-8 py-3.5 rounded-lg shadow-md uppercase tracking-wider cursor-pointer"
            >
              Contact Insurance Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
