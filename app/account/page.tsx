"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import {
  LayoutDashboard, Package, Heart, MapPin, User, LogOut,
  ArrowRight, Loader2, CheckCircle, MapPinned, X, ShoppingBag,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import type { Product } from "@/lib/data";
import DynamicAddressForm from "@/components/account/address";
import { Money } from "@/components/Price";
import PageHeroBanner from "@/components/PageHeroBanner";

type Tab = "dashboard" | "orders" | "wishlist" | "addresses" | "profile" | "vault" | "reviews";

/* ─────────────────────────────────────────────────────────────────
   LOGIN / REGISTER PANEL (logged-out state)
───────────────────────────────────────────────────────────────── */
function AuthPanel() {
  const { login, register, busy } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const err =
      mode === "login"
        ? await login(form.email, form.password)
        : await register(form);
    if (err) setError(err);
  }

  return (
    <div className="bg-[#f8f9fa]">
      <PageHeroBanner
        title={mode === "login" ? "Login to Your Account" : "Create an Account"}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Account" }]}
        showCta={false}
      />

      {/* ── Cards ── */}
      <div className="container max-w-6xl mx-auto px-4 pt-6 pb-12">

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {mode === "login" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

            {/* LEFT: Registered Customers */}
            <div className="bg-white border border-gray-200 rounded-xl p-7 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1.5">
                Registered Customers
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                If you have an account, sign in with your email address.
              </p>

              <form onSubmit={submit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Email <span className="text-[#ed1c24]">*</span>
                  </label>
                  <input
                    required type="email"
                    value={form.email} onChange={set("email")}
                    className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Password <span className="text-[#ed1c24]">*</span>
                  </label>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={form.password} onChange={set("password")}
                    className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4 accent-[#ed1c24] cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Show Password</span>
                </label>

                <div className="flex items-center justify-between gap-4 mt-1">
                  <button
                    type="submit" disabled={busy}
                    className="btn-cta py-3 px-7 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed min-w-[110px]"
                  >
                    <span>{busy ? "Signing in…" : "Sign In"}</span>
                    {busy && <Loader2 size={13} className="animate-spin relative z-10" />}
                  </button>
                  <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-[#ed1c24] transition-colors underline-offset-4 hover:underline">
                    Forgot Your Password?
                  </Link>
                </div>
              </form>
            </div>

            {/* RIGHT: New Customers */}
            <div className="bg-white border border-gray-200 rounded-xl p-7 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1.5">
                New Customers
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Creating an account has many benefits: check out faster, keep more than one address, track orders and more.
              </p>
              <button
                onClick={() => { setMode("register"); setError(""); }}
                className="btn-cta py-3 px-7 rounded-lg text-xs"
              >
                <span>Create an Account</span>
              </button>
            </div>
          </div>

        ) : (
          <div className="flex justify-center">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-xl">

              {/* ── PERSONAL INFORMATION ── */}
              <div className="border-b border-gray-200 px-7 py-4">
                <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Personal Information</h2>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (form.password !== confirmPassword) { setError("Passwords do not match."); return; }
                submit(e);
              }} className="px-7 py-6 flex flex-col gap-5">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      First Name <span className="text-[#ed1c24]">*</span>
                    </label>
                    <input
                      required type="text"
                      value={form.firstname} onChange={set("firstname")}
                      className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Last Name <span className="text-[#ed1c24]">*</span>
                    </label>
                    <input
                      required type="text"
                      value={form.lastname} onChange={set("lastname")}
                      className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* ── SIGN-IN INFORMATION ── */}
                <div className="border-t border-gray-200 pt-5 -mx-7 px-7">
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4">Sign-in Information</h3>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                        Email <span className="text-[#ed1c24]">*</span>
                      </label>
                      <input
                        required type="email"
                        value={form.email} onChange={set("email")}
                        className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                        Password <span className="text-[#ed1c24]">*</span>
                      </label>
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={form.password} onChange={set("password")}
                        className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                        Confirm Password <span className="text-[#ed1c24]">*</span>
                      </label>
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border border-gray-300 hover:border-gray-400 focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all bg-white text-gray-900"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="w-4 h-4 accent-[#ed1c24] cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">Show Password</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="submit" disabled={busy}
                    className="btn-cta py-3 px-7 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
                  >
                    <span>{busy ? "Creating…" : "Create an Account"}</span>
                    {busy && <Loader2 size={13} className="animate-spin relative z-10" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); setConfirmPassword(""); }}
                    className="text-sm text-gray-500 hover:text-[#ed1c24] transition-colors underline-offset-4 hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



/* ─────────────────────────────────────────────────────────────────
   ACCOUNT DASHBOARD (logged-in state)
───────────────────────────────────────────────────────────────── */
function FormatAddress({ address }: { address: any }) {
  return (
    <div className="text-sm text-gray-700 leading-relaxed text-left">
      <p className="font-semibold text-gray-800">{address.firstname} {address.lastname}</p>
      <p className="mt-1">{address.street.join(", ")}</p>
      <p>{address.city}{address.region?.region ? `, ${address.region.region}` : ""} {address.postcode ?? ""}</p>
      {address.country_code && <p className="uppercase">{address.country_code}</p>}
      {address.telephone && <p className="mt-1 text-xs text-gray-500">T: {address.telephone}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ACCOUNT DASHBOARD (logged-in state)
   Matches the layout in Image 1
───────────────────────────────────────────────────────────────── */
function AccountDashboard() {
  const { customer, logout, busy, refresh } = useAuth();
  const { addItem } = useCart();
  const { wishlistItems, removeFromWishlist, moveToCart, loading: wishlistLoading } = useWishlist();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get("tab") as Tab;
    if (t && ["dashboard", "orders", "wishlist", "addresses", "profile", "vault", "reviews"].includes(t)) {
      return t;
    }
    return "dashboard";
  });

  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (t && ["dashboard", "orders", "wishlist", "addresses", "profile", "vault", "reviews"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // Payment tokens (Vault) dynamic state
  const [paymentTokens, setPaymentTokens] = useState<any[]>([]);
  const [paymentTokensLoading, setPaymentTokensLoading] = useState(false);
  const [deletingTokenHash, setDeletingTokenHash] = useState<string | null>(null);

  // Reviews dynamic state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "vault") {
      setPaymentTokensLoading(true);
      const token = localStorage.getItem("customer_token");
      fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "paymentTokens", token }),
      })
        .then((r) => r.json())
        .then((data) => {
          setPaymentTokens(data.tokens || []);
          setPaymentTokensLoading(false);
        })
        .catch(() => {
          setPaymentTokens([]);
          setPaymentTokensLoading(false);
        });
    } else if (activeTab === "reviews") {
      setReviewsLoading(true);
      const token = localStorage.getItem("customer_token");
      fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "reviews", token }),
      })
        .then((r) => r.json())
        .then((data) => {
          setReviews(data.reviews || []);
          setReviewsLoading(false);
        })
        .catch(() => {
          setReviews([]);
          setReviewsLoading(false);
        });
    }
  }, [activeTab]);

  async function handleDeletePaymentToken(publicHash: string) {
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    setDeletingTokenHash(publicHash);
    try {
      const token = localStorage.getItem("customer_token");
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "deletePaymentToken", token, publicHash }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setPaymentTokens((prev) => prev.filter((t) => t.public_hash !== publicHash));
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete payment method.");
    } finally {
      setDeletingTokenHash(null);
    }
  }

  // Address management state
  const [addressMode, setAddressMode] = useState<"list" | "create" | "edit">("list");
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Order Detail View state
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  useEffect(() => {
    if (!selectedOrderNumber) {
      setOrderDetail(null);
      return;
    }
    let active = true;
    setOrderDetailLoading(true);
    const token = localStorage.getItem("customer_token");
    fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "orderDetail", token, number: selectedOrderNumber }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) {
          alert(data.error);
        } else {
          setOrderDetail(data.order);
        }
        setOrderDetailLoading(false);
      })
      .catch((err) => {
        if (active) setOrderDetailLoading(false);
        console.error(err);
      });
    return () => {
      active = false;
    };
  }, [selectedOrderNumber]);

  async function handleDeleteAddress(id: number) {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const token = localStorage.getItem("customer_token");
      const res = await fetch("/api/account", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "deleteAddress", token, id }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else await refresh();
    } catch (err: any) { alert(err.message || "Failed to delete address"); }
  }

  // ── Profile / Edit Account state ──────────────────────────────────
  const [profileForm, setProfileForm] = useState({ firstname: "", lastname: "" });
  const [changeEmail, setChangeEmail] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [allowRemote, setAllowRemote] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [profileCurrentPwd, setProfileCurrentPwd] = useState("");
  const [profileNewPwd, setProfileNewPwd] = useState("");
  const [profileConfirmPwd, setProfileConfirmPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  useEffect(() => {
    if (customer) {
      setProfileForm({ firstname: customer.firstname || "", lastname: customer.lastname || "" });
      setProfileEmail(customer.email || "");
    }
  }, [customer]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    if (changePassword && profileNewPwd !== profileConfirmPwd) {
      setProfileError("New passwords do not match.");
      setProfileSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("customer_token");

      // 1. Update name
      const nameRes = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "updateProfile",
          token,
          input: { firstname: profileForm.firstname, lastname: profileForm.lastname },
        }),
      });
      const nameData = await nameRes.json();
      if (nameData.error) throw new Error(nameData.error);

      // 2. Update email if checked
      if (changeEmail && profileEmail !== customer?.email) {
        const emailRes = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "updateEmail",
            token,
            email: profileEmail,
            password: profileCurrentPwd,
          }),
        });
        const emailData = await emailRes.json();
        if (emailData.error) throw new Error(emailData.error);
      }

      // 3. Change password if checked
      if (changePassword && profileCurrentPwd && profileNewPwd) {
        const pwdRes = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "changePassword",
            token,
            currentPassword: profileCurrentPwd,
            newPassword: profileNewPwd,
          }),
        });
        const pwdData = await pwdRes.json();
        if (pwdData.error) throw new Error(pwdData.error);
      }

      await refresh();
      setProfileSuccess("Account information saved successfully.");
      setProfileCurrentPwd("");
      setProfileNewPwd("");
      setProfileConfirmPwd("");
    } catch (err: any) {
      setProfileError(err.message || "Failed to save account information.");
    } finally {
      setProfileSaving(false);
    }
  }

  if (!customer) return null;
  const money = (v: number, c: string) => <Money value={v} currency={c} />;
  const orders = customer.orders?.items ?? [];

  const defaultBillingAddress = customer.addresses?.find((a) => a.default_billing);
  const defaultShippingAddress = customer.addresses?.find((a) => a.default_shipping);

  return (
    <div className="bg-white pb-8 lg:pb-10">
      <PageHeroBanner
        title="My Account"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "My Account" }]}
        showCta={false}
      />
      <div className="container max-w-6xl mx-auto px-4 pt-8 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8 items-start">
          {/* Sidebar */}
          <aside className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-6 flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="flex flex-col gap-3.5">
              <button
                onClick={() => { setActiveTab("dashboard"); setSelectedOrderNumber(null); }}
                className={`text-left text-sm transition-colors ${activeTab === "dashboard" ? "text-[#ed1c24] font-bold" : "text-gray-700 hover:text-black font-medium"
                  }`}
              >
                My Account
              </button>
              <button
                onClick={() => { setActiveTab("orders"); setSelectedOrderNumber(null); }}
                className={`text-left text-sm transition-colors ${activeTab === "orders" ? "text-[#ed1c24] font-bold" : "text-gray-700 hover:text-black font-medium"
                  }`}
              >
                My Orders
              </button>
            </div>

            <div className="flex flex-col gap-3.5 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  const targetAddr = defaultBillingAddress || defaultShippingAddress || customer.addresses?.[0] || null;
                  setEditingAddress(targetAddr);
                  setAddressMode(targetAddr ? "edit" : "create");
                  setActiveTab("addresses");
                  setSelectedOrderNumber(null);
                }}
                className={`text-left text-sm transition-colors ${activeTab === "addresses" ? "text-[#ed1c24] font-bold" : "text-gray-700 hover:text-black font-medium"
                  }`}
              >
                Address Book
              </button>
              <button
                onClick={() => { setActiveTab("profile"); setSelectedOrderNumber(null); }}
                className={`text-left text-sm transition-colors ${activeTab === "profile" ? "text-[#ed1c24] font-bold" : "text-gray-700 hover:text-black font-medium"
                  }`}
              >
                Account Information
              </button>
              <button
                onClick={() => { setActiveTab("vault"); setSelectedOrderNumber(null); }}
                className={`text-left text-sm transition-colors ${activeTab === "vault" ? "text-[#ed1c24] font-bold" : "text-gray-700 hover:text-black font-medium"
                  }`}
              >
                Stored Payment Methods
              </button>
            </div>

            <div className="flex flex-col gap-3.5 pt-6 border-t border-gray-200">
              <button
                onClick={() => { setActiveTab("reviews"); setSelectedOrderNumber(null); }}
                className={`text-left text-sm transition-colors ${activeTab === "reviews" ? "text-[#ed1c24] font-bold" : "text-gray-700 hover:text-black font-medium"
                  }`}
              >
                My Product Reviews
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={logout}
                disabled={busy}
                className="text-left text-sm text-gray-700 hover:text-red-600 font-medium transition-colors disabled:opacity-60"
              >
                Logout
              </button>
            </div>
          </aside>

          {/* Content Box */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 lg:p-8 min-w-0">
            {/* Dashboard tab */}
            {activeTab === "dashboard" && (
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-4 mb-6">
                  My Account
                </h1>

                {/* Account Information */}
                <div className="mb-8">
                  <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-3.5">
                    Account Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-left uppercase tracking-wider">
                        Contact Information
                      </div>
                      <div className="p-5 text-left flex flex-col items-start">
                        <p className="text-sm font-semibold text-gray-800">
                          {customer.firstname} {customer.lastname}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{customer.email}</p>
                        <div className="flex justify-start gap-2 mt-5 pt-4 border-t border-gray-100 w-full">
                          <button
                            onClick={() => setActiveTab("profile")}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setActiveTab("profile")}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Book */}
                <div className="mb-8">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 mb-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">
                      Address Book
                    </h2>
                    <button
                      onClick={() => {
                        const targetAddr = defaultBillingAddress || defaultShippingAddress || customer.addresses?.[0] || null;
                        setEditingAddress(targetAddr);
                        setAddressMode(targetAddr ? "edit" : "create");
                        setActiveTab("addresses");
                      }}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-800 px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Manage Addresses
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Default Billing Card */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col">
                      <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-left uppercase tracking-wider">
                        Default Billing Address
                      </div>
                      <div className="p-5 text-left flex-1 flex flex-col justify-between min-h-[160px]">
                        {defaultBillingAddress ? (
                          <div className="text-left mb-4">
                            <FormatAddress address={defaultBillingAddress} />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 my-auto py-4">
                            You have not set a default billing address.
                          </p>
                        )}
                        <div className="pt-4 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setEditingAddress(defaultBillingAddress || null);
                              setAddressMode(defaultBillingAddress ? "edit" : "create");
                              setActiveTab("addresses");
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Edit Address
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Default Shipping Card */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col">
                      <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-left uppercase tracking-wider">
                        Default Shipping Address
                      </div>
                      <div className="p-5 text-left flex-1 flex flex-col justify-between min-h-[160px]">
                        {defaultShippingAddress ? (
                          <div className="text-left mb-4">
                            <FormatAddress address={defaultShippingAddress} />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 my-auto py-4">
                            You have not set a default shipping address.
                          </p>
                        )}
                        <div className="pt-4 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setEditingAddress(defaultShippingAddress || null);
                              setAddressMode(defaultShippingAddress ? "edit" : "create");
                              setActiveTab("addresses");
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Edit Address
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders tab */}
            {activeTab === "orders" && (
              selectedOrderNumber ? (
                <OrderDetailView
                  number={selectedOrderNumber}
                  order={orderDetail}
                  loading={orderDetailLoading}
                  money={money}
                  onBack={() => setSelectedOrderNumber(null)}
                />
              ) : (
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 pb-4 mb-6">
                    MY ORDERS
                  </h1>
                  {orders.length === 0 ? (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded px-4 py-3 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-5a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>You have placed no orders.</span>
                    </div>
                  ) : (
                    <OrdersList
                      orders={orders}
                      money={money}
                      token={typeof window !== "undefined" ? localStorage.getItem("customer_token") : null}
                      customerName={`${customer.firstname} ${customer.lastname}`}
                      onViewOrder={(number) => setSelectedOrderNumber(number)}
                    />
                  )}
                </div>
              )
            )}

            {/* Wishlist tab */}
            {activeTab === "wishlist" && (
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-4 mb-6">
                  MY WISH LIST
                </h1>
                {wishlistLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="flex items-center gap-3 bg-[#fef8e7] border border-[#fbeed5] text-[#8a6d3b] rounded-md px-4 py-3 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 flex-shrink-0 text-[#c09853]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-5a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>You have no items in your wish list.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wishlistItems.map((item) => {
                      const p = item.product;
                      return (
                        <div key={item.id} className="group bg-[#f8f9fa] border border-gray-200 rounded-xl overflow-hidden flex flex-col relative">
                          <button
                            onClick={() => removeFromWishlist(p.sku)}
                            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-red-50 p-1.5 rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                          <Link href={p.urlKey ? `/${locale}/product/${p.urlKey}` : "/"} className="block aspect-square relative bg-white border-b border-gray-100">
                            <ProductImage src={p.image} alt={p.name} fill className="object-contain p-2" sizes="200px" />
                          </Link>
                          <div className="p-3.5 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                              <p className="text-sm font-extrabold text-gray-900 mt-1">{money(p.price ?? 0, p.currency || "AED")}</p>
                            </div>
                            <button
                              onClick={() => moveToCart(item.id)}
                              className="bg-black hover:bg-[#ed1c24] text-white text-[11px] font-bold py-2 mt-3 rounded-lg uppercase tracking-wider transition-colors w-full"
                            >
                              Add to cart
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Addresses tab */}
            {activeTab === "addresses" && (
              <div>
                {/* ── List View ── */}
                {addressMode === "list" && (
                  <>
                    <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-4 mb-6">
                      ADDRESS BOOK
                    </h1>

                    {/* Default Addresses */}
                    <div className="mb-8">
                      <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-4">
                        Default Addresses
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Default Billing */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-center uppercase tracking-wider">
                            Default Billing Address
                          </div>
                          <div className="p-5 flex flex-col justify-between min-h-[160px]">
                            {defaultBillingAddress ? (
                              <div className="text-sm text-gray-800 leading-relaxed">
                                <p className="font-semibold">{defaultBillingAddress.firstname} {defaultBillingAddress.lastname}</p>
                                <p>{defaultBillingAddress.street?.join(", ")}</p>
                                <p className="text-[#ed1c24]">{defaultBillingAddress.city}{defaultBillingAddress.region?.region ? `, ${defaultBillingAddress.region.region}` : ""}{defaultBillingAddress.postcode ? `, ${defaultBillingAddress.postcode}` : ""}</p>
                                <p className="text-[#ed1c24]">{defaultBillingAddress.country_code === "SA" ? "Saudi Arabia" : defaultBillingAddress.country_code}</p>
                                {defaultBillingAddress.telephone && <p>T: {defaultBillingAddress.telephone}</p>}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">You have not set a default billing address.</p>
                            )}
                            <button
                              onClick={() => { setEditingAddress(defaultBillingAddress || null); setAddressMode(defaultBillingAddress ? "edit" : "create"); }}
                              className="mt-4 border border-gray-300 hover:bg-gray-100 text-gray-800 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Change Billing Address
                            </button>
                          </div>
                        </div>

                        {/* Default Shipping */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-center uppercase tracking-wider">
                            Default Shipping Address
                          </div>
                          <div className="p-5 flex flex-col justify-between min-h-[160px]">
                            {defaultShippingAddress ? (
                              <div className="text-sm text-gray-800 leading-relaxed">
                                <p className="font-semibold">{defaultShippingAddress.firstname} {defaultShippingAddress.lastname}</p>
                                <p>{defaultShippingAddress.street?.join(", ")}</p>
                                <p className="text-[#ed1c24]">{defaultShippingAddress.city}{defaultShippingAddress.region?.region ? `, ${defaultShippingAddress.region.region}` : ""}{defaultShippingAddress.postcode ? `, ${defaultShippingAddress.postcode}` : ""}</p>
                                <p className="text-[#ed1c24]">{defaultShippingAddress.country_code === "SA" ? "Saudi Arabia" : defaultShippingAddress.country_code}</p>
                                {defaultShippingAddress.telephone && <p>T: {defaultShippingAddress.telephone}</p>}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">You have not set a default shipping address.</p>
                            )}
                            <button
                              onClick={() => { setEditingAddress(defaultShippingAddress || null); setAddressMode(defaultShippingAddress ? "edit" : "create"); }}
                              className="mt-4 border border-gray-300 hover:bg-gray-100 text-gray-800 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Change Shipping Address
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Entries */}
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-4 border-b border-gray-100 pb-2">
                        Additional Address Entries
                      </h2>
                      {(customer.addresses?.filter(a => !a.default_billing && !a.default_shipping).length ?? 0) === 0 ? (
                        <p className="text-sm text-gray-500 mb-5">You have no other address entries in your address book.</p>
                      ) : (() => {
                        const extras = customer.addresses.filter(a => !a.default_billing && !a.default_shipping);
                        return (
                          <div className="mb-5 overflow-x-auto">
                            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-[#f8f9fa] border-b border-gray-200">
                                  {["First Name", "Last Name", "Street Address", "City", "Country", "State", "Zip/Postal Code", "Phone", ""].map((h) => (
                                    <th key={h} className="text-left text-[11px] font-black uppercase tracking-wider text-gray-700 px-3 py-2.5 whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {extras.map((a, i) => (
                                  <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                                    <td className="px-3 py-2.5 text-gray-800">{a.firstname}</td>
                                    <td className="px-3 py-2.5 text-gray-800">{a.lastname}</td>
                                    <td className="px-3 py-2.5 text-gray-800">{a.street?.join(", ")}</td>
                                    <td className="px-3 py-2.5 text-gray-800">{a.city}</td>
                                    <td className="px-3 py-2.5 text-gray-800">{a.country_code === "SA" ? "Saudi Arabia" : a.country_code === "AE" ? "United Arab Emirates" : a.country_code}</td>
                                    <td className="px-3 py-2.5 text-[#ed1c24]">{a.region?.region ?? ""}</td>
                                    <td className="px-3 py-2.5 text-gray-800">{a.postcode ?? ""}</td>
                                    <td className="px-3 py-2.5 text-gray-800 whitespace-nowrap">{a.telephone ?? ""}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                      <button onClick={() => { setEditingAddress(a); setAddressMode("edit"); }}
                                        className="border border-gray-300 hover:bg-gray-100 text-gray-800 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-colors mr-1.5">Edit</button>
                                      <button onClick={() => handleDeleteAddress(a.id)}
                                        className="border border-red-300 hover:bg-red-50 text-red-600 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-colors">Delete</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 px-1">
                              <span>{extras.length} Item{extras.length !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        );
                      })()}
                      <button
                        onClick={() => setAddressMode("create")}
                        className="bg-black hover:bg-[#ed1c24] text-white px-5 py-2.5 rounded font-black text-xs uppercase tracking-wider transition-colors"
                      >
                        Add New Address
                      </button>
                    </div>
                  </>
                )}

                {/* ── Create / Edit Form ── */}
                {(addressMode === "create" || addressMode === "edit") && (
                  <DynamicAddressForm
                    mode={addressMode as "create" | "edit"}
                    editingAddress={editingAddress}
                    customer={customer}
                    onSuccess={async () => {
                      await refresh();
                      setAddressMode("list");
                      setEditingAddress(null);
                    }}
                    onBack={() => {
                      setAddressMode("list");
                      setEditingAddress(null);
                    }}
                  />
                )}
              </div>
            )}



            {activeTab === "profile" && (
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-4 mb-6">
                  EDIT ACCOUNT INFORMATION
                </h1>

                {profileError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
                    {profileSuccess}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-8">
                  {/* Account Information */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4 border-b border-gray-100 pb-2">
                      Account Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 uppercase mb-1.5 block">
                          First Name *
                        </label>
                        <input
                          required
                          type="text"
                          value={profileForm.firstname}
                          onChange={(e) => setProfileForm({ ...profileForm, firstname: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 uppercase mb-1.5 block">
                          Last Name *
                        </label>
                        <input
                          required
                          type="text"
                          value={profileForm.lastname}
                          onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                        />
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col gap-2.5 mt-5">
                      <label className="flex items-cente cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={changeEmail}
                          onChange={(e) => setChangeEmail(e.target.checked)}
                          className="w-4 h-4 accent-[#ed1c24] cursor-pointer"
                        />
                        <span className="text-sm text-gray-800">Change Email</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={changePassword}
                          onChange={(e) => setChangePassword(e.target.checked)}
                          className="w-4 h-4 accent-[#ed1c24] cursor-pointer"
                        />
                        <span className="text-sm text-gray-800">Change Password</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allowRemote}
                          onChange={(e) => setAllowRemote(e.target.checked)}
                          className="w-4 h-4 accent-[#ed1c24] cursor-pointer"
                        />
                        <span className="text-sm text-gray-800">Allow remote shopping assistance</span>
                        <span
                          title="Allows a store representative to view and assist with your session."
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-gray-500 text-[10px] font-bold cursor-help"
                        >
                          ?
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Change Email & Password section — only shows if at least one box is checked */}
                  {(changeEmail || changePassword) && (
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4 border-b border-gray-100 pb-2">
                        Change Email and Password
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Email — shown only when changeEmail is checked */}
                        {changeEmail && (
                          <div>
                            <label className="text-[11px] font-bold text-gray-700 uppercase mb-1.5 block">
                              Email *
                            </label>
                            <input
                              required
                              type="email"
                              value={profileEmail}
                              onChange={(e) => setProfileEmail(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                            />
                          </div>
                        )}

                        {/* Current Password — always required when either box is checked */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 uppercase mb-1.5 block">
                            Current Password *
                          </label>
                          <input
                            required
                            type={showPassword ? "text" : "password"}
                            value={profileCurrentPwd}
                            onChange={(e) => setProfileCurrentPwd(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                          />
                        </div>

                        {/* New Password — shown only when changePassword is checked */}
                        {changePassword && (
                          <>
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 uppercase mb-1.5 block">
                                New Password *
                              </label>
                              <input
                                required
                                type={showPassword ? "text" : "password"}
                                value={profileNewPwd}
                                onChange={(e) => setProfileNewPwd(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 uppercase mb-1.5 block">
                                Confirm New Password *
                              </label>
                              <input
                                required
                                type={showPassword ? "text" : "password"}
                                value={profileConfirmPwd}
                                onChange={(e) => setProfileConfirmPwd(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Show Password toggle */}
                      <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                          className="w-4 h-4 accent-[#ed1c24] cursor-pointer"
                        />
                        <span className="text-sm text-gray-800">Show Password</span>
                      </label>
                    </div>
                  )}

                  {/* Save button */}
                  <div>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-black hover:bg-[#ed1c24] text-white px-6 py-2.5 rounded font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-60"
                    >
                      {profileSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Stored Payment Methods tab */}
            {activeTab === "vault" && (
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-4 mb-6">
                  STORED PAYMENT METHODS
                </h1>

                {paymentTokensLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : paymentTokens.length === 0 ? (
                  <div className="flex items-center gap-3 bg-[#fef8e7] border border-[#fbeed5] text-[#8a6d3b] rounded-md px-4 py-3 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 flex-shrink-0 text-[#c09853]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-5a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>You have no stored payment methods.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-[#f8f9fa] border-b border-gray-200">
                          <th className="text-left text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">Card Number</th>
                          <th className="text-left text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">Expiration Date</th>
                          <th className="text-left text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">Type</th>
                          <th className="text-right text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentTokens.map((token) => {
                          let details: any = {};
                          try {
                            details = typeof token.details === "string" ? JSON.parse(token.details) : token.details || {};
                          } catch (_) {}
                          const maskedCC = details.maskedCC || details.cardNumber || "****";
                          const expDate = details.expirationDate || details.expiration || (details.month && details.year ? `${details.month}/${details.year}` : "—");
                          const cardType = details.type || token.type || token.payment_method_code || "Card";

                          return (
                            <tr key={token.public_hash} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-gray-800">
                                Ending in {maskedCC.slice(-4)}
                              </td>
                              <td className="px-4 py-3 text-gray-600">{expDate}</td>
                              <td className="px-4 py-3 uppercase text-xs font-semibold text-gray-700">{cardType}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  disabled={deletingTokenHash === token.public_hash}
                                  onClick={() => handleDeletePaymentToken(token.public_hash)}
                                  className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider disabled:opacity-50"
                                >
                                  {deletingTokenHash === token.public_hash ? "Deleting…" : "Delete"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* My Product Reviews tab */}
            {activeTab === "reviews" && (
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-4 mb-6">
                  MY PRODUCT REVIEWS
                </h1>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="flex items-center gap-3 bg-[#fef8e7] border border-[#fbeed5] text-[#8a6d3b] rounded-md px-4 py-3 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 flex-shrink-0 text-[#c09853]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-5a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>You have submitted no reviews.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((rev, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h3 className="font-bold text-gray-900 text-sm">{rev.product?.name || "Product"}</h3>
                          <span className="text-xs text-gray-500">{rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ""}</span>
                        </div>
                        {rev.summary && <p className="font-semibold text-gray-800 text-sm mb-1">{rev.summary}</p>}
                        {rev.text && <p className="text-sm text-gray-600 leading-relaxed">{rev.text}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailView({
  number,
  order,
  loading,
  money,
  onBack,
}: {
  number: string;
  order: any;
  loading: boolean;
  money: (v: number, c: string) => React.ReactNode;
  onBack: () => void;
}) {
  if (loading) {
    return (
      <div className="animate-pulse">
        {/* Back button placeholder */}
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />

        {/* Header placeholder */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-7 bg-gray-200 rounded w-48" />
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>

        {/* Tab placeholder */}
        <div className="border-b border-gray-200 flex mb-0.5">
          <div className="border border-b-0 border-gray-200 bg-white px-5 py-2.5 rounded-t-md">
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>

        {/* Table placeholder */}
        <div className="border border-gray-200 rounded-b-md overflow-hidden bg-white mb-8">
          <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-3 flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-12" />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
          <div className="divide-y divide-gray-100 px-4 py-4 space-y-4">
            <div className="flex justify-between items-center py-2">
              <div className="space-y-2 w-1/3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-12" />
            </div>
            <div className="flex justify-between items-center py-2">
              <div className="space-y-2 w-1/3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-12" />
            </div>
          </div>
          <div className="flex justify-end p-5 bg-[#fafafa] border-t border-gray-100">
            <div className="w-full max-w-[280px] space-y-3">
              <div className="flex justify-between"><div className="h-3 bg-gray-200 rounded w-16" /><div className="h-3 bg-gray-200 rounded w-12" /></div>
              <div className="flex justify-between"><div className="h-3 bg-gray-200 rounded w-24" /><div className="h-3 bg-gray-200 rounded w-12" /></div>
              <div className="flex justify-between pt-2 border-t border-gray-200"><div className="h-4 bg-gray-200 rounded w-20" /><div className="h-4 bg-gray-200 rounded w-16" /></div>
            </div>
          </div>
        </div>

        {/* Order Info placeholder */}
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="border border-gray-200 rounded-lg h-32 bg-white" />
          <div className="border border-gray-200 rounded-lg h-32 bg-white" />
          <div className="border border-gray-200 rounded-lg h-32 bg-white" />
          <div className="border border-gray-200 rounded-lg h-32 bg-white" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#ed1c24] font-bold uppercase tracking-wider mb-4">Order not found.</p>
        <button
          onClick={onBack}
          className="border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const orderDateFormatted = (() => {
    try {
      const d = new Date(order.order_date.replace(/-/g, "/"));
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return order.order_date;
    }
  })();

  const billing = order.billing_address;
  const shipping = order.shipping_address;

  const countryName = (code?: string) =>
    code === "AE" ? "United Arab Emirates" : code === "SA" ? "Saudi Arabia" : code;

  // Format tax display (sum all taxes) — real title/rate come straight from
  // Magento's own tax line (CUSTOMER_ORDER_DETAIL_QUERY already fetches
  // `title`/`rate`), never a hardcoded label/percentage.
  const taxSum = order.total.taxes?.reduce((sum: number, tax: any) => sum + (tax.amount?.value || 0), 0) || 0;
  const taxCurrency = order.total.taxes?.[0]?.amount?.currency || "AED";
  const taxTitle = order.total.taxes?.[0]?.title || "Tax";
  const taxRate = order.total.taxes?.[0]?.rate;

  /* order.shipping_method/carrier are set on the order itself at placement
     time (real CustomerOrder fields — confirmed via live schema
     introspection), so they're always present. shipments[].tracking only
     exists once a shipment has actually been created, so it's a fallback,
     not the primary source. */
  const shipmentTracking = order.shipments?.[0]?.tracking?.[0];
  const shippingMethodLabel =
    order.shipping_method ||
    [order.carrier, shipmentTracking?.title || shipmentTracking?.carrier].filter(Boolean).join(" – ") ||
    "Not yet dispatched";

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-gray-500 hover:text-black text-xs font-bold uppercase tracking-wider mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to My Orders
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900">
              ORDER # {order.number}
            </h1>
            <span className="border border-gray-300 text-gray-700 bg-gray-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest rounded-sm">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {orderDateFormatted}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 flex mb-0.5">
        <div className="border border-b-0 border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-900 rounded-t-md select-none">
          Items Ordered
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-gray-200 rounded-b-md overflow-hidden bg-white mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200">
                <th className="text-left text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">Product Name</th>
                <th className="text-left text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">SKU</th>
                <th className="text-right text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">Price</th>
                <th className="text-center text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">Qty</th>
                <th className="text-right text-[11px] font-black uppercase tracking-wider text-gray-700 px-4 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-4 text-gray-900 font-bold leading-normal max-w-xs">{item.product_name}</td>
                  <td className="px-4 py-4 text-gray-500 font-medium">{item.product_sku}</td>
                  <td className="px-4 py-4 text-right text-gray-900 font-bold whitespace-nowrap">
                    {money(item.product_sale_price.value, item.product_sale_price.currency)}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-700 font-bold whitespace-nowrap">
                    Ordered {item.quantity_ordered}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-900 font-extrabold whitespace-nowrap">
                    {money(item.product_sale_price.value * item.quantity_ordered, item.product_sale_price.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end p-5 bg-[#fafafa] border-t border-gray-100">
          <div className="w-full max-w-[280px] space-y-2.5">
            <div className="flex justify-between items-center text-[12px] text-gray-600 font-medium">
              <span>Subtotal</span>
              <span className="text-gray-900 font-bold">
                {money(order.total.subtotal.value, order.total.subtotal.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[12px] text-gray-600 font-medium">
              <span>Shipping & Handling</span>
              <span className="text-gray-900 font-bold">
                {money(order.total.shipping_handling?.total_amount?.value || 0, order.total.shipping_handling?.total_amount?.currency || "AED")}
              </span>
            </div>
            {taxSum > 0 && (
              <div className="flex justify-between items-center text-[12px] text-gray-600 font-medium">
                <span>{taxTitle}{taxRate ? ` (${taxRate}%)` : ""}</span>
                <span className="text-gray-900 font-bold">{money(taxSum, taxCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[13px] text-gray-955 font-black pt-2.5 border-t border-gray-200">
              <span>Grand Total</span>
              <span className="text-base text-gray-955">
                {money(order.total.grand_total.value, order.total.grand_total.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Information Section */}
      <h2 className="text-base font-black uppercase tracking-wider text-gray-900 mb-4">
        Order Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Billing Address Box */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-left uppercase tracking-wider">
            Billing Address
          </div>
          <div className="p-5 text-left text-sm text-gray-800 leading-relaxed">
            {billing ? (
              <>
                <p className="font-semibold text-gray-900">{billing.firstname} {billing.lastname}</p>
                <p>{billing.street?.join(", ")}</p>
                <p>{billing.city}{billing.region ? `, ${billing.region}` : ""}{billing.postcode ? `, ${billing.postcode}` : ""}</p>
                <p>{countryName(billing.country_code)}</p>
                {billing.telephone && <p className="text-xs text-gray-500 mt-1">T: {billing.telephone}</p>}
              </>
            ) : (
              <p className="text-gray-400">No billing address found.</p>
            )}
          </div>
        </div>

        {/* Shipping Method Box */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-left uppercase tracking-wider">
            Shipping Method
          </div>
          <div className="p-5 text-left text-sm text-gray-800 leading-relaxed font-semibold">
            {shippingMethodLabel}
          </div>
        </div>

        {/* Shipping Address Box */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-left uppercase tracking-wider">
            Shipping Address
          </div>
          <div className="p-5 text-left text-sm text-gray-800 leading-relaxed">
            {shipping ? (
              <>
                <p className="font-semibold text-gray-900">{shipping.firstname} {shipping.lastname}</p>
                <p>{shipping.street?.join(", ")}</p>
                <p>{shipping.city}{shipping.region ? `, ${shipping.region}` : ""}{shipping.postcode ? `, ${shipping.postcode}` : ""}</p>
                <p>{countryName(shipping.country_code)}</p>
                {shipping.telephone && <p className="text-xs text-gray-500 mt-1">T: {shipping.telephone}</p>}
              </>
            ) : (
              <p className="text-gray-400">No shipping address found.</p>
            )}
          </div>
        </div>

        {/* Payment Method Box */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 text-left uppercase tracking-wider">
            Payment Method
          </div>
          <div className="p-5 text-left text-sm text-gray-800 leading-relaxed font-semibold">
            {order.payment_methods?.[0]?.name || "Not available"}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatOrderDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr.replace(/-/g, "/"));
    if (isNaN(d.getTime())) return dateStr;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  } catch {
    return dateStr;
  }
}

function OrdersList({
  orders, money, token, limit, onViewOrder, customerName,
}: {
  orders: { number: string; order_date: string; status: string; total: { grand_total: { value: number; currency: string } } }[];
  money: (v: number, c: string) => React.ReactNode;
  token?: string | null;
  limit?: number;
  onViewOrder?: (number: string) => void;
  customerName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const { syncCustomerCart } = useCart();

  const [reordering, setReordering] = useState<string | null>(null);
  const [reorderMsg, setReorderMsg] = useState<{ number: string; ok: boolean; msg: string } | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  async function handleReorder(orderNumber: string) {
    setReordering(orderNumber);
    setReorderMsg(null);
    try {
      const userToken = token || (typeof window !== "undefined" ? localStorage.getItem("customer_token") : null);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "reorder", orderNumber, token: userToken }),
      });
      const data = (await res.json()) as {
        cartId?: string;
        error?: string;
        userErrors?: { message: string }[];
        userInputErrors?: { message: string }[];
      };
      const errList = data.userErrors || data.userInputErrors || [];
      const errMsg = errList.map((e) => e.message).join(", ");
      const ok = !data.error && !errMsg;

      if (!ok) {
        setReorderMsg({ number: orderNumber, ok: false, msg: errMsg || data.error || "Failed to reorder items." });
      } else {
        /* reorderItems returns the id of whatever cart Magento just put the
           items in — which the CartProvider's own in-memory cartIdRef may
           not already match (e.g. if the customer's previous cart had
           expired and Magento created a new one). Writing that id straight
           to localStorage doesn't update the live ref, so a plain refresh()
           could re-fetch the WRONG (stale) cart. syncCustomerCart() instead
           re-resolves the customer's real active cart from Magento itself
           and updates cart-context's state correctly either way. */
        await syncCustomerCart().catch(() => {});
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cart-updated"));
        }
        router.push(`/${locale}/cart`);
      }
    } catch (err: any) {
      setReorderMsg({ number: orderNumber, ok: false, msg: err?.message || "Network error" });
    } finally {
      setReordering(null);
    }
  }

  const allOrders = limit ? orders.slice(0, limit) : orders;
  const totalPages = Math.ceil(allOrders.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentOrders = allOrders.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full">
      {reorderMsg && (
        <div
          className={`mb-4 p-3 rounded text-xs flex items-start justify-between gap-2 border transition-all duration-200 ${
            reorderMsg.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-[#ed1c24]"
          }`}
        >
          <div className="flex items-center gap-2">
            {!reorderMsg.ok && (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0 text-[#ed1c24]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span>{reorderMsg.msg}</span>
          </div>
          <button
            onClick={() => setReorderMsg(null)}
            className="text-gray-400 hover:text-gray-600 font-bold ml-2 cursor-pointer p-0.5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-none w-full">
        <table className="w-full text-sm border-collapse table-fixed min-w-[620px]">
          <thead>
            <tr className="bg-[#fcfcfc] border-b border-gray-200 h-[44px]">
              <th className="w-[24%] text-center text-xs font-bold text-gray-800 px-3 border-r border-gray-200 whitespace-nowrap">
                Order #
              </th>
              <th className="w-[16%] text-center text-xs font-bold text-gray-800 px-3 border-r border-gray-200 whitespace-nowrap">
                Date
              </th>
              <th className="w-[20%] text-center text-xs font-bold text-gray-800 px-3 border-r border-gray-200 whitespace-nowrap">
                Order Total
              </th>
              <th className="w-[18%] text-center text-xs font-bold text-gray-800 px-3 border-r border-gray-200 whitespace-nowrap">
                Status
              </th>
              <th className="w-[22%] text-center text-xs font-bold text-gray-800 px-3 whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((o) => {
              const statusLower = o.status?.toLowerCase() || "";
              const canReorder = !["processing", "payment_review", "payment review", "holded", "fraud"].includes(statusLower);

              return (
                <tr key={o.number} className="border-b border-gray-200 hover:bg-gray-50/60 transition-colors h-[56px]">
                  <td className="px-3 text-center text-sm font-normal text-gray-800 border-r border-gray-200 whitespace-nowrap">
                    {o.number}
                  </td>
                  <td className="px-3 text-center text-sm text-gray-700 border-r border-gray-200 whitespace-nowrap">
                    {formatOrderDate(o.order_date)}
                  </td>
                  <td className="px-3 text-center text-sm text-gray-900 font-bold border-r border-gray-200 whitespace-nowrap tabular-nums">
                    {money(o.total.grand_total.value, o.total.grand_total.currency)}
                  </td>
                  <td className="px-3 text-center text-sm text-gray-700 border-r border-gray-200 whitespace-nowrap">
                    {o.status ? o.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : ""}
                  </td>
                  <td className="px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewOrder?.(o.number)}
                        className="w-[82px] h-[30px] flex items-center justify-center bg-[#f0f2f5] hover:bg-[#e4e7eb] text-gray-700 rounded text-xs font-normal transition-colors cursor-pointer"
                      >
                        View Order
                      </button>
                      {canReorder && (
                        <button
                          onClick={() => handleReorder(o.number)}
                          disabled={reordering === o.number}
                          className="w-[82px] h-[30px] flex items-center justify-center gap-1.5 bg-[#f0f2f5] hover:bg-[#e4e7eb] text-gray-700 rounded text-xs font-normal transition-colors disabled:opacity-70 cursor-pointer"
                        >
                          {reordering === o.number ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />
                              <span className="text-[11px]">Loading</span>
                            </>
                          ) : (
                            "Reorder"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer bar with Item count and Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs text-gray-600">
        <div>
          {allOrders.length} Item(s)
        </div>
        <div className="flex items-center gap-4">
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 border rounded text-xs font-semibold ${
                    p === currentPage
                      ? "bg-black text-white border-black"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                ›
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2.5 py-1 text-xs bg-white text-gray-800 outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>per page</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────── */
function AccountPageSkeleton() {
  return (
    <div className="bg-white pb-8 lg:pb-10">
      <PageHeroBanner
        title="My Account"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "My Account" }]}
        showCta={false}
      />
      <div className="container max-w-6xl mx-auto px-4 pt-8 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8 items-start">
          {/* Sidebar Skeleton */}
          <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-6 flex flex-col gap-6 animate-pulse">
            <div className="flex flex-col gap-4">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="flex flex-col gap-4 pt-6 border-t border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="flex flex-col gap-4 pt-6 border-t border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
            <div className="pt-6 border-t border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 lg:p-8 animate-pulse">
            <div className="h-7 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="space-y-6">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="border border-gray-100 rounded-lg p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="border border-gray-100 rounded-lg p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { ready, isLoggedIn } = useAuth();

  if (!ready) {
    return <AccountPageSkeleton />;
  }
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      {isLoggedIn ? <AccountDashboard /> : <AuthPanel />}
    </Suspense>
  );
}
