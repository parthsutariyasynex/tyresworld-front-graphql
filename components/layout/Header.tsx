"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";

type NavItem = { label: string; href: string };

export default function Header() {
  const pathname = usePathname();
  const { count: cartCount } = useCart();
  // Category links come from the GraphQL menu API and render directly in the bar.
  const [categories, setCategories] = useState<NavItem[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/menu")
      .then((r) => r.json())
      .then((json) => {
        if (!active || !Array.isArray(json.menu)) return;
        setCategories(
          json.menu.map((c: { label: string; href: string }) => ({
            label: c.label,
            href:  c.href,
          }))
        );
      })
      .catch(() => {/* no categories on failure */});
    return () => { active = false; };
  }, []);

  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    ...categories,
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-[0_1px_20px_rgba(0,0,0,0.07)]"
            : "bg-white/95 backdrop-blur-md border-b border-ink/5"
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 flex-shrink-0 z-10">
              <span className="font-display text-2xl tracking-tight text-ink">
                Maison
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent mb-1 self-end" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-3.5 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                      isActive
                        ? "text-ink bg-cream"
                        : "text-ink/60 hover:text-ink hover:bg-cream"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-0.5">
              {/* Search */}
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-cream rounded-full px-4 py-2 mr-1">
                  <Search size={15} className="text-ink/40 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search products…"
                    className="bg-transparent text-sm text-ink outline-none w-36 lg:w-48 placeholder:text-ink/30"
                  />
                  <button onClick={() => setSearchOpen(false)} aria-label="Close search">
                    <X size={14} className="text-ink/40 hover:text-ink transition-colors" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 rounded-full hover:bg-cream transition-colors"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              )}

              <Link
                href="/account"
                className="p-2.5 rounded-full hover:bg-cream transition-colors hidden sm:flex"
                aria-label="Account"
              >
                <User size={18} />
              </Link>

              <Link
                href="/account"
                className="relative p-2.5 rounded-full hover:bg-cream transition-colors hidden md:flex"
                aria-label="Wishlist"
              >
                <Heart size={18} />
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-ink text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                  3
                </span>
              </Link>

              <Link
                href="/cart"
                className="relative p-2.5 rounded-full hover:bg-cream transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 bg-accent text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2.5 rounded-full hover:bg-cream transition-colors lg:hidden ml-1"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-[320px] max-w-full bg-white flex flex-col animate-slide-in-right">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-ink/5 flex-shrink-0">
              <Link href="/" className="flex items-center gap-1">
                <span className="font-display text-xl tracking-tight text-ink">Maison</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent mb-1 self-end" />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full hover:bg-cream transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-4 border-b border-ink/5 flex-shrink-0">
              <div className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3">
                <Search size={15} className="text-ink/40 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products…"
                  className="bg-transparent text-sm text-ink outline-none flex-1 placeholder:text-ink/30"
                />
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-5 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block py-3.5 border-b border-ink/5 text-base font-medium transition-colors ${
                    pathname === item.href ? "text-ink" : "text-ink/70 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Drawer footer */}
            <div className="px-5 py-5 border-t border-ink/5 flex flex-col gap-2 flex-shrink-0">
              <div className="flex gap-3">
                <Link
                  href="/account"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-ink/60 hover:text-ink bg-cream rounded-xl transition-colors"
                >
                  <User size={15} /> Account
                </Link>
                <Link
                  href="/account"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-ink/60 hover:text-ink bg-cream rounded-xl transition-colors"
                >
                  <Heart size={15} /> Wishlist
                </Link>
              </div>
              <Link href="/cart" className="btn-primary text-sm py-3.5 w-full">
                <ShoppingBag size={16} /> View Cart ({cartCount})
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
