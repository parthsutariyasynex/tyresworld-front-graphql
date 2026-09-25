import Link from "next/link";
import { Search, Home, MessageCircle, Phone, ArrowRight, AlertTriangle } from "lucide-react";
import { APP_CONFIG } from "@/src/config/app-config";


export default function NotFoundContent() {
  const whatsappHref = `https://wa.me/${APP_CONFIG.contact.whatsapp}?text=${encodeURIComponent(
    "Hello TyresWorld, I need help finding the right tyres for my car."
  )}`;

  return (
    <section className="min-h-[70vh] flex flex-col justify-center items-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-3xl w-full text-center">
        {/* ── Top Badge ── */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-100 text-[#ed1c24] text-xs font-black uppercase tracking-wider mb-5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-[#ed1c24]" />
          <span>404 • Page Not Found</span>
        </div>

        {/* ── Big Title ── */}
        <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight leading-tight mb-3">
          Could Not Match Any Products
        </h1>

        {/* ── Subtitle ── */}
        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
          The page or tyre configuration you are looking for doesn&apos;t exist, has no available matching products, or may have been moved.
        </p>

        {/* ── Main Action Buttons ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
          <Link
            href="/tyres"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#ed1c24] text-white text-sm font-extrabold uppercase tracking-wide hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Search All Tyres</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-gray-300 text-gray-800 text-sm font-extrabold uppercase tracking-wide hover:bg-gray-50 hover:border-gray-400 transition-all shadow-xs active:scale-95"
          >
            <Home className="w-4 h-4 text-gray-600" />
            <span>Back to Home</span>
          </Link>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 text-white text-sm font-extrabold uppercase tracking-wide hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Support</span>
          </a>
        </div>


        {/* ── Contact Assistance Card ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-gray-900 text-white text-left">
          <div>
            <div className="font-bold text-sm sm:text-base">Need a custom size or immediate assistance?</div>
            <div className="text-xs text-gray-400">Our UAE tyre fitment specialists are available 7 days a week.</div>
          </div>
          <a
            href={`tel:${APP_CONFIG.contact.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors shrink-0"
          >
            <Phone className="w-3.5 h-3.5 text-[#ed1c24]" />
            <span>{APP_CONFIG.contact.phone}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
