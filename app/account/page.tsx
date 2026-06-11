"use client";

import { useState, useEffect } from "react";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  User,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Clock,
  Truck,
} from "lucide-react";
type Tab = "dashboard" | "orders" | "wishlist" | "addresses" | "profile";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "profile", label: "Profile", icon: User },
];

const mockOrders = [
  {
    id: "MAI-2024-001",
    date: "April 28, 2026",
    items: 3,
    total: 218,
    status: "Delivered",
    statusIcon: CheckCircle,
    statusColor: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "MAI-2024-002",
    date: "May 5, 2026",
    items: 1,
    total: 74,
    status: "In Transit",
    statusIcon: Truck,
    statusColor: "text-blue-600 bg-blue-50",
  },
  {
    id: "MAI-2024-003",
    date: "May 12, 2026",
    items: 2,
    total: 132,
    status: "Processing",
    statusIcon: Clock,
    statusColor: "text-amber-600 bg-amber-50",
  },
];

const mockAddresses = [
  {
    id: "a1",
    label: "Home",
    default: true,
    name: "Alex Johnson",
    street: "123 Oak Street, Apt 4B",
    city: "New York, NY 10001",
    country: "United States",
  },
  {
    id: "a2",
    label: "Work",
    default: false,
    name: "Alex Johnson",
    street: "450 Fifth Avenue, Suite 900",
    city: "New York, NY 10018",
    country: "United States",
  },
];

export default function AccountPage() {
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  // Wishlist preview comes from the product API (first few products).
  useEffect(() => {
    let active = true;
    fetch("/api/products?categoryUid=MTg=&pageSize=4", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => { if (active) setWishlistProducts(json.products ?? []); })
      .catch(() => { /* leave empty */ });
    return () => { active = false; };
  }, []);
  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex@example.com",
    phone: "+1 (415) 555-0192",
  });
  const [profileSaved, setProfileSaved] = useState(false);

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  return (
    <>
      {/* Page header */}
      <div className="bg-cream border-b border-ink/5 py-10">
        <div className="container">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
              <span className="font-display text-2xl text-white">A</span>
            </div>
            <div>
              <h1 className="font-display text-3xl text-ink">
                Hello, {profile.firstName}!
              </h1>
              <p className="text-sm text-ink/50 mt-0.5">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            {/* Mobile: horizontal scroll */}
            <div className="flex lg:flex-col gap-1 overflow-x-auto hide-scrollbar pb-1 lg:pb-0">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
                    activeTab === id
                      ? "bg-ink text-white"
                      : "text-ink/60 hover:text-ink hover:bg-cream"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {activeTab !== id && (
                    <ChevronRight size={14} className="ml-auto text-ink/25 hidden lg:block" />
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div>
                <h2 className="font-display text-2xl text-ink mb-7">Dashboard</h2>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                  {[
                    { label: "Total Orders", value: "12", sub: "All time" },
                    { label: "Wishlist Items", value: "7", sub: "Saved products" },
                    { label: "Total Spent", value: "$1,248", sub: "All time" },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="bg-cream rounded-2xl p-5">
                      <p className="font-display text-4xl text-ink mb-1">{value}</p>
                      <p className="text-sm font-medium text-ink">{label}</p>
                      <p className="text-xs text-ink/40 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Recent order */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-ink">Recent Orders</h3>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-xs font-medium text-ink/50 hover:text-ink flex items-center gap-1 transition-colors"
                    >
                      View all <ArrowRight size={12} />
                    </button>
                  </div>
                  {mockOrders.slice(0, 2).map((order) => {
                    const Icon = order.statusIcon;
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-cream rounded-xl mb-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">{order.id}</p>
                          <p className="text-xs text-ink/40 mt-0.5">
                            {order.date} · {order.items} item{order.items !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${order.statusColor}`}>
                            <Icon size={12} /> {order.status}
                          </span>
                          <p className="text-sm font-semibold text-ink">${order.total}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Orders */}
            {activeTab === "orders" && (
              <div>
                <h2 className="font-display text-2xl text-ink mb-7">My Orders</h2>
                <div className="flex flex-col gap-4">
                  {mockOrders.map((order) => {
                    const Icon = order.statusIcon;
                    return (
                      <div key={order.id} className="border border-ink/8 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <p className="font-semibold text-ink">{order.id}</p>
                            <p className="text-sm text-ink/45 mt-0.5">{order.date}</p>
                          </div>
                          <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${order.statusColor}`}>
                            <Icon size={12} /> {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink/50">
                            {order.items} item{order.items !== 1 ? "s" : ""}
                          </span>
                          <span className="font-semibold text-ink">${order.total}</span>
                        </div>
                        <div className="flex gap-3 mt-4 pt-4 border-t border-ink/5">
                          <button className="btn-secondary text-xs px-4 py-2">
                            View Details
                          </button>
                          {order.status === "Delivered" && (
                            <button className="btn-secondary text-xs px-4 py-2">
                              Reorder
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wishlist */}
            {activeTab === "wishlist" && (
              <div>
                <h2 className="font-display text-2xl text-ink mb-7">
                  Wishlist
                  <span className="text-base font-sans font-normal text-ink/40 ml-3">
                    {wishlistProducts.length} items
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wishlistProducts.map((p) => (
                    <div key={p.id} className="group relative bg-cream rounded-2xl overflow-hidden">
                      <div className="aspect-square relative">
                        <ProductImage src={p.image} alt={p.name} fill className="object-cover" sizes="200px" />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-ink truncate">{p.name}</p>
                        <p className="text-sm font-semibold text-ink mt-0.5">${p.price}</p>
                        <button
                          onClick={() => addItem(p)}
                          className="btn-primary w-full text-xs py-2 mt-2 rounded-xl"
                        >
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
                <div className="flex items-center justify-between mb-7">
                  <h2 className="font-display text-2xl text-ink">Addresses</h2>
                  <button className="btn-secondary text-xs px-4 py-2">
                    + Add address
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {mockAddresses.map((addr) => (
                    <div key={addr.id} className="border border-ink/8 rounded-2xl p-5 relative">
                      {addr.default && (
                        <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-3">
                        {addr.label}
                      </p>
                      <p className="font-medium text-ink text-sm">{addr.name}</p>
                      <p className="text-sm text-ink/55 mt-1">{addr.street}</p>
                      <p className="text-sm text-ink/55">{addr.city}</p>
                      <p className="text-sm text-ink/55">{addr.country}</p>
                      <div className="flex gap-3 mt-4 pt-4 border-t border-ink/5">
                        <button className="text-xs font-medium text-ink/50 hover:text-ink transition-colors">
                          Edit
                        </button>
                        {!addr.default && (
                          <>
                            <span className="text-ink/15">|</span>
                            <button className="text-xs font-medium text-ink/50 hover:text-ink transition-colors">
                              Set as default
                            </button>
                            <span className="text-ink/15">|</span>
                            <button className="text-xs font-medium text-red-400 hover:text-red-500 transition-colors">
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile */}
            {activeTab === "profile" && (
              <div>
                <h2 className="font-display text-2xl text-ink mb-7">Profile</h2>
                <form onSubmit={handleProfileSave} className="max-w-lg flex flex-col gap-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                        First name
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                        Last name
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" className="btn-primary text-sm px-6 py-3">
                      Save changes
                    </button>
                    {profileSaved && (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                        <CheckCircle size={15} /> Saved!
                      </span>
                    )}
                  </div>
                </form>

                {/* Change password */}
                <div className="mt-10 pt-10 border-t border-ink/5 max-w-lg">
                  <h3 className="font-semibold text-ink mb-5">Change Password</h3>
                  <div className="flex flex-col gap-4">
                    {["Current password", "New password", "Confirm new password"].map((l) => (
                      <div key={l}>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                          {l}
                        </label>
                        <input type="password" placeholder="••••••••" className="input-field" />
                      </div>
                    ))}
                    <button className="btn-secondary text-sm px-6 py-3 self-start">
                      Update password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
