"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Loader2,
} from "lucide-react";
import PageHeroBanner from "@/components/PageHeroBanner";

type ContactInfo = {
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_label?: string | null;
  whatsapp?: string | null;
  whatsapp_label?: string | null;
  map_url?: string | null;
};

type SocialLink = {
  platform: string;
  url: string;
};

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    fetch("/api/footer")
      .then((res) => res.json())
      .then((data) => {
        if (data?.footer?.contact) setContactInfo(data.footer.contact);
        if (data?.footer?.social) setSocialLinks(data.footer.social);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          telephone: phone.trim(),
          comment: message.trim(),
        }),
      });

      const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; error?: string };
      if (data.ok) {
        setSent(true);
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        setError(data.error || "Could not send your message. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      <PageHeroBanner
        title="Contact Us"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
      />

      {/* ── Main Content ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
          
          {/* ── Left Column: Get In Touch Info ── */}
          <div className="lg:col-span-6 xl:col-span-6">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-gray-950 font-sans leading-tight">
              GET IN TOUCH WITH US – <span className="text-[#ed1c24]">TYRESWORLD.AE</span>
            </h2>

            <p className="text-xs sm:text-[14px] text-gray-800 leading-relaxed font-normal mt-4 mb-7 max-w-xl">
              tyresworld.ae is highly rated as an Online Tyre Shop in the UAE, renowned for best tyre prices and outstanding customer service. Join our loyal customer base who rely on us for their tyre needs.
            </p>

            <div className="space-y-5 mb-8">
              {/* ADDRESS */}
              {(contactInfo?.address ?? true) && (
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#d52d27] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wide text-gray-950 mb-1">
                      ADDRESS
                    </h3>
                    <p className="text-xs sm:text-[13.5px] text-gray-800 leading-snug">
                      {contactInfo?.address || "DSP Trade Hub FZ-LLC, Compass Building, Al Shohada Road, AL Hamra Industrial Zone-FZ, Ras Al Khaimah, United Arab Emirates"}
                    </p>
                  </div>
                </div>
              )}

              {/* WHATSAPP */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#d52d27] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
                <div className="pt-0.5">
                  <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wide text-gray-950 mb-1">
                    WHATSAPP
                  </h3>
                  <a
                    href={
                      contactInfo?.whatsapp
                        ? `https://api.whatsapp.com/send/?phone=${contactInfo.whatsapp.replace(/\D/g, "")}&text=Hi%20tyresworld.ae`
                        : "https://api.whatsapp.com/send/?phone=971505069575&text=Hi%20tyresworld.ae"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-[13.5px] text-gray-800 hover:text-[#ed1c24] transition-colors font-medium inline-block"
                  >
                    {contactInfo?.whatsapp_label || contactInfo?.whatsapp || "+971 50 506 9575"}
                  </a>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#d52d27] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <div className="pt-0.5">
                  <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wide text-gray-950 mb-1">
                    EMAIL
                  </h3>
                  <a
                    href={`mailto:${contactInfo?.email || "info@tyresworld.ae"}`}
                    className="text-xs sm:text-[13.5px] text-gray-800 hover:text-[#ed1c24] transition-colors font-medium inline-block"
                  >
                    {contactInfo?.email || "info@tyresworld.ae"}
                  </a>
                </div>
              </div>

              {/* HOURS OF OPERATION */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#d52d27] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <svg className="w-5 h-5 fill-none stroke-white stroke-[2.2]" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="pt-0.5">
                  <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wide text-gray-950 mb-1">
                    HOURS OF OPERATION
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-gray-800 leading-snug">
                    Monday to Saturday: 8:30 am – 6:00 pm
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>

            {/* FOLLOW US ON */}
            <div>
              <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wide text-gray-950 mb-3">
                FOLLOW US ON
              </h3>
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <a
                  href={
                    socialLinks.find((s) => s.platform.toLowerCase().includes("facebook"))?.url ||
                    "https://www.facebook.com/tyresworld.ae/"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="group w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-sm overflow-hidden"
                >
                  <svg className="w-4 h-4 fill-current transition-transform duration-500 ease-in-out group-hover:rotate-[360deg]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href={
                    socialLinks.find((s) => s.platform.toLowerCase().includes("instagram"))?.url ||
                    "https://www.instagram.com/tyresworld.ae/"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="group w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-sm overflow-hidden"
                >
                  <svg className="w-4 h-4 fill-current transition-transform duration-500 ease-in-out group-hover:rotate-[360deg]" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* ── Right Column: Send Us A Message Form ── */}
          <div className="lg:col-span-6 xl:col-span-6 bg-[#ededed] rounded-xl p-6 sm:p-8 lg:p-9 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-950 mb-6 font-sans">
              SEND US A MESSAGE
            </h2>

            {sent ? (
              <div className="bg-white border border-green-200 rounded-xl p-6 flex flex-col items-center text-center gap-3">
                <CheckCircle size={36} className="text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Thank you!</h3>
                <p className="text-sm text-gray-600">
                  Your message has been sent successfully. Our team will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-2 bg-black hover:bg-[#ed1c24] text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-4 py-2.5">
                    {error}
                  </div>
                )}

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-800 mb-1.5 block">
                      Name <span className="text-[#ed1c24]">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=""
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-md px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 mb-1.5 block">
                      Email <span className="text-[#ed1c24]">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=""
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-md px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1.5 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-md px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors placeholder:text-gray-400"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1.5 block">
                    Message <span className="text-[#ed1c24]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder=""
                    className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-md px-3.5 py-3 text-sm text-gray-900 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black hover:bg-[#ed1c24] text-white px-8 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    <span>{loading ? "SUBMITTING…" : "SUBMIT"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
