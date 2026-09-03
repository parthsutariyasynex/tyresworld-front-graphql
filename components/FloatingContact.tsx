"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { APP_CONFIG } from "@/src/config/app-config";
import { useScrollLock } from "@/lib/useScrollLock";

/* ── Top Icon: Phone Handset with Incoming Arrow (Exact SVG from Magento) ── */
const RequestCallbackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    className="w-[22px] h-[22px] fill-white"
    aria-hidden="true"
  >
    <path d="M505 41l-135 135H416c13.3 0 24 10.7 24 24s-10.7 24-24 24H312c-13.3 0-24-10.7-24-24V96c0-13.3 10.7-24 24-24s24 10.7 24 24v46.1L471 7c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9zM117.5 1.4c19.4-5.3 39.7 4.6 47.4 23.2l40 96c6.8 16.3 2.1 35.2-11.6 46.3L144 207.3c33.3 70.4 90.3 127.4 160.7 160.7L345 318.7c11.2-13.7 30-18.4 46.3-11.6l96 40c18.6 7.7 28.5 28 23.2 47.4l-24 88C481.8 499.9 466 512 448 512C200.6 512 0 311.4 0 64C0 46 12.1 30.2 29.5 25.4l88-24z" />
  </svg>
);

/* ── Bottom Icon: WhatsApp Speech Bubble (Exact SVG from Magento) ── */
const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 32 32"
    className="w-[30px] h-[30px] fill-white"
    aria-hidden="true"
  >
    <path d="M16 2.5C8.5 2.5 2.5 8.5 2.5 16c0 2.6.7 5.1 2.1 7.2L3 30l7-1.5c2 1.2 4.3 1.9 6.8 1.9 7.5 0 13.5-6 13.5-13.5S24.3 2.5 16 2.5zm0 24.7c-2.2 0-4.3-.6-6.1-1.7l-.4-.3-4.5 1 1-4.4-.3-.4c-1.2-1.9-1.9-4.1-1.9-6.4 0-6.7 5.5-12.2 12.2-12.2s12.2 5.5 12.2 12.2-5.5 12.2-12.2 12.2zm6.7-9.1c-.4-.2-2.2-1.1-2.5-1.2-.4-.1-.6-.2-.9.2-.2.4-1 1.2-1.2 1.4-.2.3-.5.3-.8.1-.4-.2-1.6-.6-3-1.8-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.5-.7.2-.2.2-.4.4-.6.1-.2.1-.4 0-.6-.1-.2-.9-2.1-1.2-2.8-.3-.8-.6-.6-.9-.7h-.7c-.3 0-.7.1-1 .4-.4.4-1.3 1.3-1.3 3.1 0 1.9 1.4 3.6 1.6 3.9.2.3 2.7 4.1 6.5 5.7.9.4 1.6.6 2.2.8.9.3 1.7.3 2.4.2.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.2-.3-.3-.7-.5z" />
  </svg>
);

export default function FloatingContact() {
  const whatsappNumber = APP_CONFIG.contact.whatsapp.replace(/[^0-9]/g, "") || "971505069575";
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  useScrollLock(modalOpen);

  useEffect(() => {
    if (!modalOpen) return;
    setSent(false);
    setError(null);
    nameRef.current?.focus();
  }, [modalOpen]);

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
          comment: `Callback request via floating button. Phone: ${number}`,
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 items-center">
        {/* ── Top Button: Black Request Callback ─────────────────── */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-[58px] h-[58px] sm:w-[60px] sm:h-[60px] bg-black hover:bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-lg shadow-black/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Request a Callback"
          title="Request a Callback"
        >
          <RequestCallbackIcon />
        </button>

        {/* ── Bottom Button: Green WhatsApp ─────────────────── */}
        <a
          href={`https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=Hi%20tyresworld.ae`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-[58px] h-[58px] sm:w-[60px] sm:h-[60px] bg-[#3cc13b] hover:bg-[#34ab33] text-white rounded-full flex items-center justify-center shadow-lg shadow-black/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
        >
          <WhatsAppIcon />
        </a>
      </div>

      {/* ── Request Callback Modal ────────────────────────────── */}
      {modalOpen && (
        <div className="callback-modal" role="presentation">
          <div
            className="callback-modal-backdrop"
            onClick={() => setModalOpen(false)}
          />

          <div
            className="callback-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="floating-callback-title"
          >
            <button
              type="button"
              className="callback-modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 id="floating-callback-title" className="callback-modal-title">
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
                  className="button-primary callback-submit w-full mt-4 bg-[#ed1c24] hover:bg-[#c6181d] text-white py-3 rounded-lg font-bold transition-colors cursor-pointer"
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

