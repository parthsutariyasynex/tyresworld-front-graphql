"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";

export default function RequestCallback() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setSent(false);
    setError(null);
    nameRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const number = String(form.get("number") ?? "").trim();

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          telephone: number,
          comment: `Callback request from the website. Phone: ${number}`,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "We couldn't send your request. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ══ CTA Red Strip with Original Brush Top Edge ═════════════════════════════════ */}
      <section className="relative w-full bg-[#ed1c24] py-8 sm:py-10 md:py-11 mt-10">
        {/* Exact Torn Brush Edge directly across the top */}
        <div
          className="absolute -top-[30px] left-0 right-0 w-full h-[35px] bg-[url('/bg/brush-edge.png')] bg-repeat-x bg-bottom z-10 pointer-events-none select-none"
          aria-hidden="true"
        />

        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            {/* Left Content */}
            <div className="text-white space-y-1">
              <h2 className="text-2xl sm:text-[28px] md:text-[32px] font-black uppercase tracking-wider leading-tight text-white m-0">
                REQUEST A CALLBACK
              </h2>
              <p className="text-white/95 text-xs sm:text-[13px] font-medium tracking-normal m-0">
                For a Free Professional Consultation
              </p>
            </div>

            {/* Right Button */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="bg-[#0e0e0e] hover:bg-black text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider px-7 sm:px-9 py-3.5 rounded-lg transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer border border-white/5"
              >
                REQUEST A CALLBACK
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Modal ══════════════════════════════════════════════ */}
      {open && (
        <div className="callback-modal" role="presentation">
          <div
            className="callback-modal-backdrop"
            onClick={() => setOpen(false)}
          />

          <div
            className="callback-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="callback-modal-title"
            ref={dialogRef}
          >
            <button
              type="button"
              className="callback-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 id="callback-modal-title" className="callback-modal-title">
              Request a Callback
            </h2>

            {sent ? (
              <p className="callback-modal-msg" role="status">
                Thanks — we&apos;ve got your request and will call you back shortly.
              </p>
            ) : (
              <form onSubmit={handleSubmit} noValidate={false}>
                <label className="callback-field">
                  <span>Name</span>
                  <input
                    ref={nameRef}
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    className="input-field"
                    placeholder="Your Full Name"
                  />
                </label>

                <label className="callback-field">
                  <span>Phone number</span>
                  <input
                    name="number"
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    className="input-field"
                    placeholder="+971 50 000 0000"
                  />
                </label>

                <label className="callback-field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input-field"
                    placeholder="yourname@example.com"
                  />
                </label>

                {error && (
                  <p className="callback-modal-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="button-primary callback-submit w-full mt-4 bg-[#ed1c24] hover:bg-[#c6181d] text-white py-3 rounded-lg font-bold transition-colors"
                  disabled={submitting}
                >
                  <span>{submitting ? "Sending…" : "Submit"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
