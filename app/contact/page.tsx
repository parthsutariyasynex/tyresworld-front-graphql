"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Twitter,
  Youtube,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit us",
    lines: ["12 Rue du Faubourg", "75008 Paris, France"],
  },
  {
    icon: Phone,
    title: "Call us",
    lines: ["+1 (415) 555-0192", "Mon–Fri, 9am–6pm CET"],
  },
  {
    icon: Mail,
    title: "Email us",
    lines: ["hello@maison.co", "We reply within 24h"],
  },
  {
    icon: Clock,
    title: "Opening hours",
    lines: ["Mon–Fri: 9:00 – 18:00", "Sat: 10:00 – 15:00"],
  },
];

const subjects = [
  "Order Enquiry",
  "Product Question",
  "Returns & Refunds",
  "Press & Media",
  "Wholesale",
  "Other",
];

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Your name is required.";
    if (!form.email.trim()) {
      e.email = "Your email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Please enter a valid email address.";
    }
    if (!form.subject) e.subject = "Please select a subject.";
    if (!form.message.trim()) {
      e.message = "A message is required.";
    } else if (form.message.trim().length < 10) {
      e.message = "Please write at least 10 characters.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((err) => ({ ...err, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  }

  return (
    <>
      {/* Header */}
      <div className="bg-cream py-14 lg:py-20 border-b border-ink/5">
        <div className="container max-w-3xl">
          <p className="text-xs text-ink/40 mb-3">
            <a href="/" className="hover:text-ink transition-colors">Home</a>
            {" / "}
            <span className="text-ink">Contact</span>
          </p>
          <span className="eyebrow mb-4 block">
            <span className="w-5 h-px bg-ink-muted" />
            Get in touch
          </span>
          <h1 className="section-title mb-3">We&apos;d love to hear from you</h1>
          <p className="text-ink/55 text-base max-w-lg">
            Questions, collaborations, or just want to say hello — our team is
            here and usually responds within one business day.
          </p>
        </div>
      </div>

      <div className="container py-14 lg:py-20">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 max-w-5xl">
          {/* Form */}
          <div>
            {sent ? (
              <div className="flex flex-col items-start gap-4 py-12">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle size={28} className="text-accent" />
                </div>
                <h2 className="font-display text-3xl text-ink">
                  Message sent!
                </h2>
                <p className="text-ink/55 text-base max-w-md">
                  Thanks for reaching out, {form.name.split(" ")[0]}. We&apos;ll get
                  back to you at {form.email} within one business day.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="btn-secondary text-sm px-6 py-2.5 mt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                      Full name <span className="text-accent">*</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Smith"
                      className={`input-field ${errors.name ? "border-red-400 focus:border-red-400" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                      Email address <span className="text-accent">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      className={`input-field ${errors.email ? "border-red-400 focus:border-red-400" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                    Subject <span className="text-accent">*</span>
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className={`input-field ${errors.subject ? "border-red-400" : ""}`}
                  >
                    <option value="">Select a subject…</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                    Message <span className="text-accent">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us how we can help…"
                    className={`input-field resize-none ${errors.message ? "border-red-400 focus:border-red-400" : ""}`}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.message}</p>
                  )}
                  <p className="text-xs text-ink/30 mt-1.5 text-right">
                    {form.message.length} characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm px-8 py-3.5 self-start disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      Send message <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-5">
            {contactInfo.map(({ icon: Icon, title, lines }) => (
              <div key={title} className="bg-cream rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-card">
                  <Icon size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                    {title}
                  </p>
                  {lines.map((l) => (
                    <p key={l} className="text-sm text-ink/60">{l}</p>
                  ))}
                </div>
              </div>
            ))}

            {/* Social */}
            <div className="bg-ink rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                Follow us
              </p>
              <div className="flex gap-2">
                {[
                  { Icon: Instagram, label: "Instagram" },
                  { Icon: Twitter, label: "Twitter" },
                  { Icon: Youtube, label: "YouTube" },
                ].map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-colors"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="h-72 lg:h-96 bg-cream border-y border-ink/5 relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <MapPin size={22} className="text-accent" />
          </div>
          <p className="font-semibold text-ink">12 Rue du Faubourg, Paris</p>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs px-5 py-2"
          >
            Open in Google Maps
          </a>
        </div>
        {/* Decorative grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0B0B0F" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </>
  );
}
