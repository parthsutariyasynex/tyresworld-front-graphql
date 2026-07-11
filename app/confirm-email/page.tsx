"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react";

function ConfirmEmailInner() {
  const params  = useSearchParams();
  const router  = useRouter();
  const email   = params.get("email") ?? "";
  const key     = params.get("key") ?? "";

  const [status,  setStatus]  = useState<"loading" | "success" | "error" | "idle">(key ? "loading" : "idle");
  const [message, setMessage] = useState("");
  const [resent,  setResent]  = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!key || !email) return;
    (async () => {
      try {
        const res  = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "confirmEmail", email, confirmationKey: key }),
        });
        const data = await res.json() as { ok?: boolean; error?: string };
        if (data.ok) {
          setStatus("success");
          setTimeout(() => router.push("/account"), 3000);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Email confirmation failed. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    })();
  }, [email, key, router]);

  async function resendEmail() {
    if (!email) return;
    setResending(true);
    try {
      const res  = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "resendConfirmationEmail", email }),
      });
      const data = await res.json() as { ok?: boolean };
      if (data.ok) setResent(true);
    } catch {
      // silent
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="container py-28 text-center max-w-sm mx-auto">
      {status === "loading" && (
        <>
          <Loader2 size={40} className="animate-spin text-[#ed1c24] mx-auto mb-6" />
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Verifying your email…
          </h1>
          <p className="text-gray-400 text-sm">Please wait a moment.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Email Confirmed!
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Your account is now verified. Redirecting to your account…
          </p>
          <Link href="/account" className="inline-block bg-black text-white font-black text-xs uppercase tracking-wider py-3 px-8 rounded-sm hover:bg-[#ed1c24] transition-colors">
            Go to My Account
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-[#ed1c24]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Verification Failed
          </h1>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          {email && !resent && (
            <button
              onClick={resendEmail}
              disabled={resending}
              className="inline-flex items-center gap-2 bg-black text-white font-black text-xs uppercase tracking-wider py-3 px-8 rounded-sm hover:bg-[#ed1c24] transition-colors disabled:opacity-50"
            >
              {resending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
              Resend Verification Email
            </button>
          )}
          {resent && <p className="text-emerald-600 font-semibold text-sm">Verification email resent!</p>}
        </>
      )}

      {status === "idle" && (
        <>
          <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-6">
            <Mail size={36} className="text-gray-300" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Check your inbox for the verification link, or enter your email below to resend it.
          </p>
          {email ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold text-gray-700">{email}</p>
              <button
                onClick={resendEmail}
                disabled={resending || resent}
                className="inline-flex items-center justify-center gap-2 bg-black text-white font-black text-xs uppercase tracking-wider py-3 px-8 rounded-sm hover:bg-[#ed1c24] transition-colors disabled:opacity-50"
              >
                {resending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                {resent ? "Email Sent!" : "Resend Verification Email"}
              </button>
            </div>
          ) : (
            <Link href="/account" className="inline-block bg-black text-white font-black text-xs uppercase tracking-wider py-3 px-8 rounded-sm hover:bg-[#ed1c24] transition-colors">
              Back to Account
            </Link>
          )}
        </>
      )}
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div className="container py-28 text-center max-w-sm mx-auto"><Loader2 size={40} className="animate-spin text-[#ed1c24] mx-auto mb-6" /></div>}>
      <ConfirmEmailInner />
    </Suspense>
  );
}
