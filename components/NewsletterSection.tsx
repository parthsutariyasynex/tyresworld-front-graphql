"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  }

  return (
    <section className="py-20 lg:py-28 bg-ink overflow-hidden relative">
      {/* Decorative blob */}
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-accent/5 blur-3xl pointer-events-none"
      />

      <div className="container relative">
        <div className="max-w-2xl mx-auto text-center">
          <span className="eyebrow text-white/40 mb-5 block justify-center">
            <span className="w-5 h-px bg-white/20" />
            Stay in the loop
          </span>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] mb-5">
            Good things, <br />
            <em className="not-italic text-accent">first to your inbox</em>
          </h2>

          <p className="text-white/50 text-base mb-10 max-w-md mx-auto">
            New arrivals, honest stories, and exclusive early access. No noise —
            just the good stuff, twice a month.
          </p>

          {submitted ? (
            <div className="flex items-center justify-center gap-3 text-white">
              <CheckCircle size={22} className="text-accent" />
              <span className="font-medium">You&apos;re on the list — welcome!</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-white/10 text-white placeholder:text-white/30 border border-white/10 rounded-full px-5 py-3.5 text-sm outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-accent flex-shrink-0 text-sm px-7 py-3.5 disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Joining…
                  </span>
                ) : (
                  <>
                    Subscribe <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-white/25 text-xs mt-5">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
