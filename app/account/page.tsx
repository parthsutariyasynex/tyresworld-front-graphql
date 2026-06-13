"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import {
  LayoutDashboard, Package, Heart, MapPin, User, LogOut,
  ArrowRight, Loader2, CheckCircle, MapPinned,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import type { Product } from "@/lib/data";

type Tab = "dashboard" | "orders" | "wishlist" | "addresses" | "profile";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "profile", label: "Profile", icon: User },
];

/* ─────────────────────────────────────────────────────────────────
   LOGIN / REGISTER PANEL (logged-out state)
───────────────────────────────────────────────────────────────── */
function AuthPanel() {
  const { login, register, busy } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", password: "" });
  const [error, setError] = useState("");
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
    <div className="container py-16 lg:py-24">
      <div className="max-w-md mx-auto bg-white border border-ink/8 rounded-2xl p-8 shadow-card">
        <h1 className="font-display text-2xl text-ink mb-1 text-center">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-sm text-ink/50 text-center mb-7">
          {mode === "login" ? "Access your orders and details" : "Join to track orders and check out faster"}
        </p>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="First name" value={form.firstname} onChange={set("firstname")} className="input-field" />
              <input required placeholder="Last name" value={form.lastname} onChange={set("lastname")} className="input-field" />
            </div>
          )}
          <input required type="email" placeholder="Email" value={form.email} onChange={set("email")} className="input-field" />
          <input required type="password" placeholder="Password" value={form.password} onChange={set("password")} className="input-field" />

          <button type="submit" disabled={busy} className="btn-primary text-sm py-3.5 mt-2 disabled:opacity-60">
            {busy ? <Loader2 size={15} className="animate-spin" /> : (mode === "login" ? "Sign in" : "Create account")}
          </button>
        </form>

        <p className="text-sm text-ink/50 text-center mt-6">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-accent font-medium hover:underline"
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ACCOUNT DASHBOARD (logged-in state)
───────────────────────────────────────────────────────────────── */
function AccountDashboard() {
  const { customer, logout, busy } = useAuth();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/products?categoryUid=MTg=&pageSize=4", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (active) setWishlist(j.products ?? []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!customer) return null;
  const money = (v: number, c: string) => `${c} ${v.toLocaleString()}`;
  const orders = customer.orders?.items ?? [];

  const stats = [
    { label: "Orders", value: customer.orders?.total_count ?? 0 },
    { label: "Wishlist", value: wishlist.length },
    { label: "Addresses", value: customer.addresses?.length ?? 0 },
  ];

  return (
    <div className="container py-10 lg:py-14">
      <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12 items-start">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24">
          <div className="bg-cream rounded-2xl p-5 mb-4">
            <p className="text-xs text-ink/40 mb-0.5">Signed in as</p>
            <p className="font-semibold text-ink leading-tight">{customer.firstname} {customer.lastname}</p>
            <p className="text-xs text-ink/50 truncate">{customer.email}</p>
          </div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto hide-scrollbar">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? "bg-ink text-white" : "text-ink/60 hover:text-ink hover:bg-cream"
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
            <button
              onClick={logout}
              disabled={busy}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ink/60 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              <LogOut size={16} /> Sign out
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div>
              <h1 className="font-display text-3xl text-ink mb-6">Hello, {customer.firstname} 👋</h1>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {stats.map((s) => (
                  <div key={s.label} className="bg-cream rounded-2xl p-5">
                    <p className="text-2xl font-bold text-ink">{s.value}</p>
                    <p className="text-xs text-ink/50 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <h2 className="font-semibold text-ink mb-3">Recent orders</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-ink/50">No orders yet. <Link href="/shop" className="text-accent hover:underline">Start shopping →</Link></p>
              ) : (
                <OrdersList orders={orders.slice(0, 3)} money={money} />
              )}
            </div>
          )}

          {/* Orders */}
          {activeTab === "orders" && (
            <div>
              <h1 className="font-display text-2xl text-ink mb-6">My Orders</h1>
              {orders.length === 0 ? (
                <p className="text-sm text-ink/50">You have no orders yet.</p>
              ) : (
                <OrdersList orders={orders} money={money} />
              )}
            </div>
          )}

          {/* Wishlist */}
          {activeTab === "wishlist" && (
            <div>
              <h1 className="font-display text-2xl text-ink mb-6">Wishlist</h1>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlist.map((p) => (
                  <div key={p.id} className="group bg-cream rounded-2xl overflow-hidden">
                    <Link href={p.urlKey ? `/product/${p.urlKey}` : "/shop"} className="block aspect-square relative">
                      <ProductImage src={p.image} alt={p.name} fill className="object-cover" sizes="200px" />
                    </Link>
                    <div className="p-3">
                      <p className="text-xs font-medium text-ink truncate">{p.name}</p>
                      <p className="text-sm font-semibold text-ink mt-0.5">${p.price}</p>
                      <button onClick={() => addItem(p)} className="btn-primary w-full text-xs py-2 mt-2 rounded-xl">
                        Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Addresses */}
          {activeTab === "addresses" && (
            <div>
              <h1 className="font-display text-2xl text-ink mb-6">Addresses</h1>
              {(customer.addresses?.length ?? 0) === 0 ? (
                <p className="text-sm text-ink/50">No saved addresses yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {customer.addresses.map((a) => (
                    <div key={a.id} className="border border-ink/10 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPinned size={15} className="text-accent" />
                        <span className="font-medium text-ink text-sm">{a.firstname} {a.lastname}</span>
                        {a.default_shipping && <span className="text-[10px] uppercase tracking-wide bg-ink/5 text-ink/50 px-2 py-0.5 rounded-full">Default</span>}
                      </div>
                      <p className="text-sm text-ink/60 leading-relaxed">
                        {a.street.join(", ")}<br />
                        {a.city}{a.region?.region ? `, ${a.region.region}` : ""} {a.postcode ?? ""}<br />
                        {a.country_code}<br />
                        {a.telephone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {activeTab === "profile" && (
            <div className="max-w-md">
              <h1 className="font-display text-2xl text-ink mb-6">Profile</h1>
              <div className="flex flex-col gap-4">
                {[
                  { label: "First name", value: customer.firstname },
                  { label: "Last name", value: customer.lastname },
                  { label: "Email", value: customer.email },
                  { label: "Newsletter", value: customer.is_subscribed ? "Subscribed" : "Not subscribed" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-xs text-ink/40 mb-1">{f.label}</p>
                    <p className="text-sm text-ink font-medium border border-ink/8 rounded-xl px-4 py-3 bg-cream/50">{f.value}</p>
                  </div>
                ))}
              </div>
              <button onClick={logout} disabled={busy} className="btn-secondary text-sm px-6 py-3 mt-6 disabled:opacity-60">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersList({
  orders, money,
}: {
  orders: { number: string; order_date: string; status: string; total: { grand_total: { value: number; currency: string } } }[];
  money: (v: number, c: string) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {orders.map((o) => (
        <div key={o.number} className="flex items-center justify-between gap-4 border border-ink/8 rounded-2xl px-5 py-4">
          <div className="min-w-0">
            <p className="font-medium text-ink text-sm">Order #{o.number}</p>
            <p className="text-xs text-ink/45 mt-0.5">{o.order_date}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/60 bg-cream px-3 py-1.5 rounded-full">
              <CheckCircle size={13} className="text-emerald-500" /> {o.status}
            </span>
            <span className="font-semibold text-ink text-sm">
              {money(o.total.grand_total.value, o.total.grand_total.currency)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────── */
export default function AccountPage() {
  const { ready, isLoggedIn } = useAuth();

  if (!ready) {
    return <div className="container py-24 text-center text-ink/40">Loading your account…</div>;
  }
  return isLoggedIn ? <AccountDashboard /> : <AuthPanel />;
}
