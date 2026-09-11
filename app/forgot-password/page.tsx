"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-[#f8f9fa]">
      {/* ── Banner ── */}
      <div
        className="py-10 sm:py-14 text-center"
        style={{
          backgroundImage: "url('/img/shopping-cart-banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-wider">
            FORGOT YOUR PASSWORD?
          </h1>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="container max-w-6xl mx-auto px-4 py-10 flex justify-center">
        <div className="bg-white border border-gray-200 rounded-xl p-7 shadow-sm w-full max-w-lg">

          {sent ? (
            <div className="text-center py-4">
              <p className="text-gray-800 font-semibold mb-2">Reset link sent!</p>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for <strong>{email}</strong>, you will receive a password reset email shortly.
              </p>
              <Link
                href="/account"
                className="btn-cta py-3 px-7 rounded-lg text-xs inline-flex items-center gap-2"
              >
                <span>Back to Login</span>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">
                Please enter your email address below to receive a password reset link.
              </p>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Email <span className="text-[#ed1c24]">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 mt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-cta py-3 px-7 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
                  >
                    <span>{busy ? "Sending…" : "Reset My Password"}</span>
                    {busy && <Loader2 size={13} className="animate-spin relative z-10" />}
                  </button>
                  <Link
                    href="/account"
                    className="text-sm text-gray-500 hover:text-[#ed1c24] transition-colors underline-offset-4 hover:underline"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
