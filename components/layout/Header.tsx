"use client";

import { useState, useEffect, useRef } from "react";
import { useScrollLock } from "@/lib/useScrollLock";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import type { MenuItem } from "@/lib/magento";
import { Money } from "@/components/Price";

/* ─── Red circular icon button ──────────────────────────────── */
const ICON_BTN =
  "w-[38px] h-[38px] rounded-full bg-[#ed1c24] hover:bg-[#c6181d] " +
  "flex items-center justify-center text-white transition-colors flex-shrink-0";

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { count: cartCount, items, currency, removeItem, updateQty } = useCart();

  const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const nextLocale = locale === "ar" ? "en" : "ar";
  const switchLabel = locale === "en" ? "العربية" : "English";

  function switchLocale() {
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const nextPath = segments.join("/");
    const qs = searchParams.toString();
    router.push(`${nextPath}${qs ? `?${qs}` : ""}`);
  }

  const [categories, setCategories] = useState<MenuItem[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { customer, isLoggedIn, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  const [searchVal, setSearchVal] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (searchVal.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setSuggestionsLoading(true);
      fetch(`/api/products?search=${encodeURIComponent(searchVal)}&locale=${locale}&pageSize=35`)
        .then(r => r.json())
        .then(data => {
          const products = data.products ?? [];
          const extractedSizes = new Set<string>();
          const trimmed = searchVal.trim();

          products.forEach((p: any) => {
            if (!p.name) return;
            const stdMatch = p.name.match(/(\d{3})\/(\d{2})\s*(?:Z?R)?(\d{2})/i);
            if (stdMatch) {
              extractedSizes.add(`${stdMatch[1]}/${stdMatch[2]} R${stdMatch[3]}`);
              return;
            }
            const commMatch = p.name.match(/(\d{3})\s*R(\d{2})C?/i);
            if (commMatch) {
              extractedSizes.add(`${commMatch[1]} R${commMatch[2]}`);
            }
          });

          const result: string[] = [];
          if (trimmed) {
            result.push(trimmed);
          }
          Array.from(extractedSizes).forEach(size => {
            if (size.toLowerCase() !== trimmed.toLowerCase()) {
              result.push(size);
            }
          });

          setSuggestions(result.slice(0, 6));
          setSuggestionsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch suggestions:", err);
          setSuggestionsLoading(false);
        });
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchVal, locale]);

  const totalItemSums = items.reduce((acc, item) => acc + item.prices.row_total.value, 0);
  const subtotalExclTax = totalItemSums / 1.15;
  const fmtMoney = (v: number) => <Money value={v} currency={currency} digits={2} />;

  const localiseHref = (href: string) => {
    if (href.startsWith("/en/")) {
      return href.replace("/en/", `/${locale}/`);
    }
    return href;
  };

  /* ── API: load menu from local Next.js API route to bypass CORS issues */
  useEffect(() => {
    let active = true;
    fetch(`/api/menu?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.menu) {
          setCategories(data.menu);
        }
      })
      .catch((err) => {
        console.error("Failed to load menu:", err);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  /* ── Focus search input when opened ─────────────────────────── */
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useScrollLock(mobileOpen);

  /* ── Close everything on route change ───────────────────────── */
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setOpenDropdown(null);
    setCartDropdownOpen(false);
    setAccountDropdownOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          DESKTOP HEADER
      ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-black">
        <div className="container">
          <div className="flex items-center h-[70px] gap-4">

            {/* ── Logo ─────────────────────────────────────────── */}
            <Link
              href="/"
              className="flex-shrink-0 flex items-center"
              aria-label="PowerTyre home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/power tire-12.webp"
                alt="PowerTyre"
                className="h-[44px] w-auto object-contain"
              />
            </Link>

            {/* ── Desktop nav (centered via flex-1) ───────────── */}
            <nav
              className="hidden lg:flex flex-1 items-center justify-center gap-0.5"
              aria-label="Main navigation"
            >
              {categories.map((item) => {
                const hasChildren = !!item.children?.length;
                // item.href is always /en/… — strip locale prefix before comparing
                const normItem = item.href.replace(/^\/[a-z]{2}\//, "/");
                const normPath = pathname.replace(/^\/[a-z]{2}\//, "/");
                const isActive = normPath.startsWith(normItem);

                return hasChildren ? (
                  /* ── Dropdown item ─────────────────────────── */
                  <div
                    key={item.uid}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.uid)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={localiseHref(item.href)}
                      className={`flex items-center gap-0.5 px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${isActive ? "text-white" : "text-white/75 hover:text-white"
                        }`}
                    >
                      {item.label}
                      <ChevronDown
                        size={12}
                        className={`mt-px opacity-60 transition-transform duration-200 ${openDropdown === item.uid ? "rotate-180" : ""
                          }`}
                      />
                    </Link>

                    {/* Dropdown panel */}
                    <div
                      className={`absolute top-full ${locale === "ar" ? "right-0" : "left-0"} pt-1.5 min-w-[210px] z-50 transition-all duration-150 ${openDropdown === item.uid
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-1 pointer-events-none"
                        }`}
                    >
                      <div className="bg-white rounded-xl shadow-cardHover py-1.5 border border-ink/8">
                        {item.children!.map((child) => (
                          <Link
                            key={child.uid}
                            href={localiseHref(child.href)}
                            className="block px-4 py-2.5 text-sm text-ink/65 hover:text-ink hover:bg-cream transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Plain link ────────────────────────────── */
                  <Link
                    key={item.uid}
                    href={localiseHref(item.href)}
                    className={`px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${isActive ? "text-white" : "text-white/75 hover:text-white"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* ── Right actions ─────────────────────────────── */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto lg:ml-0 relative">

              {/* Language / store switcher */}
              <button
                onClick={switchLocale}
                className="hidden lg:flex items-center gap-1.5 text-white/70 hover:text-white text-[13px] font-medium transition-colors"
                aria-label={`Switch to ${nextLocale === "ar" ? "Arabic" : "English"}`}
              >
                <span>{switchLabel}</span>
                <span className="text-sm leading-none">{locale === "en" ? "🇸🇦" : "🇬🇧"}</span>
              </button>

              {/* Thin separator */}
              <span className="hidden lg:block w-px h-5 bg-white/15 mx-0.5" />

              {/* Search Toggle Button */}
              <button
                onClick={() => {
                  if (searchOpen) {
                    setSearchOpen(false);
                    setSearchVal("");
                    setSuggestions([]);
                  } else {
                    setSearchOpen(true);
                  }
                }}
                className={ICON_BTN}
                aria-label="Search"
              >
                <Search size={17} />
              </button>

              {/* Absolute Popover Search Bar */}
              {searchOpen && (
                <div className={`absolute top-[55px] ${locale === "ar" ? "left-0" : "right-0"} z-[99] w-[340px] sm:w-[480px] md:w-[600px] bg-white border border-gray-200 rounded-lg p-1 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200`}>
                  {/* Close button with red circle and white X icon */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchVal("");
                      setSuggestions([]);
                    }}
                    className={`absolute -top-2 ${locale === "ar" ? "-left-2" : "-right-2"} w-7 h-7 bg-[#ed1c24] hover:bg-[#d61820] text-white flex items-center justify-center rounded-full transition-colors shadow-md z-[100] focus:outline-none`}
                    aria-label="Close search"
                  >
                    <X size={15} />
                  </button>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const query = searchVal.trim();
                      if (query) {
                        router.push(`/${locale}/tyres?q=${encodeURIComponent(query)}`);
                        setSearchOpen(false);
                        setSearchVal("");
                        setSuggestions([]);
                      }
                    }}
                    className="relative w-full"
                  >
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchVal}
                      onChange={(e) => setSearchVal(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => {
                        // Small timeout to allow clicking a suggestion
                        setTimeout(() => setSearchFocused(false), 200);
                      }}
                      placeholder={locale === "ar" ? "ابحث عن مقاس الإطارات..." : "Search Tyre Size e.g 1956515 or 195/65 R15"}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 pr-11 text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#ed1c24] focus:ring-1 focus:ring-[#ed1c24] transition-colors"
                    />
                    <button
                      type="submit"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#ed1c24] hover:text-[#d61820] transition-colors focus:outline-none"
                      aria-label="Search submit"
                    >
                      <Search size={18} />
                    </button>
                  </form>

                  {/* Suggestions Dropdown */}
                  {searchFocused && suggestions.length > 0 && (
                    <ul className="absolute left-1 right-1 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl z-[101] max-h-[220px] overflow-y-auto divide-y divide-gray-50">
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>
                          <button
                            type="button"
                            onClick={() => {
                              router.push(`/${locale}/tyres?q=${encodeURIComponent(suggestion)}`);
                              setSearchOpen(false);
                              setSearchVal("");
                              setSuggestions([]);
                            }}
                            className={`w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-red-50 hover:text-[#ed1c24] font-semibold transition-colors focus:outline-none ${locale === "ar" ? "text-right" : "text-left"}`}
                          >
                            {suggestion}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Account Dropdown Wrapper */}
              <div
                className="relative hidden sm:block"
                onMouseEnter={() => setAccountDropdownOpen(true)}
                onMouseLeave={() => setAccountDropdownOpen(false)}
              >
                <Link
                  href="/account"
                  className={`${ICON_BTN}`}
                  aria-label="My account"
                >
                  <User size={17} />
                </Link>

                {/* Dropdown panel */}
                {accountDropdownOpen && isLoggedIn && (
                  <div className="absolute right-0 top-full pt-1.5 w-[220px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-md shadow-2xl border border-gray-100 p-4 text-left">
                      <div className="flex flex-col gap-2.5">
                        <div className="border-b border-gray-100 pb-2">
                          <p className="text-[10px] uppercase font-bold text-gray-400">
                            {locale === "ar" ? "مرحباً" : "Welcome"}
                          </p>
                          <p className="text-[13px] font-bold text-gray-900 truncate">
                            {customer?.firstname} {customer?.lastname}
                          </p>
                        </div>
                        <Link
                          href="/account?tab=dashboard"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="text-[12px] font-bold text-gray-700 hover:text-[#ed1c24] transition-colors"
                        >
                          {locale === "ar" ? "حسابي" : "MY ACCOUNT"}
                        </Link>
                        <Link
                          href="/account?tab=wishlist"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="text-[12px] font-bold text-gray-700 hover:text-[#ed1c24] transition-colors"
                        >
                          {locale === "ar" ? "قائمة أمنياتي" : "MY WISHLIST"}
                        </Link>
                        <button
                          onClick={async () => {
                            setAccountDropdownOpen(false);
                            await logout();
                            router.push(`/${locale}`);
                          }}
                          className="w-full text-left text-[12px] font-bold text-gray-500 hover:text-[#ed1c24] transition-colors pt-2 border-t border-gray-100"
                        >
                          {locale === "ar" ? "تسجيل الخروج" : "SIGN OUT"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Dropdown wrapper */}
              <div
                className="relative"
                onMouseEnter={() => setCartDropdownOpen(true)}
                onMouseLeave={() => setCartDropdownOpen(false)}
              >
                <Link
                  href="/cart"
                  className={`${ICON_BTN} relative`}
                  aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
                >
                  <ShoppingBag size={17} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-0.5 bg-white text-[#ed1c24] text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Dropdown panel */}
                {cartDropdownOpen && (
                  <div className="absolute right-0 top-full pt-1.5 w-[340px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-sm shadow-2xl border border-gray-100 p-4 text-left">
                      {cartCount > 0 ? (
                        <>
                          {/* Header: X Items in Cart */}
                          <div className="text-center font-extrabold text-[14px] text-gray-900 border-b border-gray-100 pb-3 mb-3">
                            {cartCount} {cartCount === 1 ? "Item" : "Items"} in Cart
                          </div>

                          {/* Subtotal */}
                          <div className="flex justify-between items-center text-[12px] font-bold text-gray-950 mb-4 px-1">
                            <span className="text-gray-500 font-medium">Cart Subtotal</span>
                            <span>{fmtMoney(subtotalExclTax)}</span>
                          </div>

                          {/* Items List */}
                          <div className="max-h-[260px] overflow-y-auto divide-y divide-gray-100 pr-1 custom-scrollbar">
                            {items.map((item) => (
                              <div key={item.uid} className="py-3 flex gap-3 items-start">
                                <div className="w-14 h-14 border border-gray-100 rounded-sm overflow-hidden bg-white p-1 flex-shrink-0 flex items-center justify-center relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.product.thumbnail?.url ?? ""}
                                    alt={item.product.name}
                                    className="object-contain w-full h-full"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold text-gray-900 leading-snug line-clamp-2">
                                    {item.product.name}
                                  </p>
                                  <p className="text-[12px] text-[#ed1c24] font-black mt-1">
                                    {fmtMoney(item.prices.price.value)}
                                  </p>

                                  {/* Qty and Delete */}
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] uppercase font-bold text-gray-400">QTY</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateQty(item.uid, parseInt(e.target.value) || 1)}
                                        className="w-10 h-7 border border-gray-200 text-center rounded-sm font-bold text-[11px] focus:border-gray-400 outline-none"
                                      />
                                    </div>
                                    <button
                                      onClick={() => setItemToRemove(item.uid)}
                                      className="text-gray-400 hover:text-gray-900 text-xs px-2 transition-colors"
                                      aria-label="Remove item"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* View and Edit Cart Button */}
                          <Link
                            href="/cart"
                            onClick={() => setCartDropdownOpen(false)}
                            className="mt-4 block w-full bg-black hover:bg-[#ed1c24] text-white font-black text-[11px] uppercase tracking-wider py-3 rounded-sm transition-colors text-center"
                          >
                            VIEW AND EDIT CART
                          </Link>
                        </>
                      ) : (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <svg className="w-14 h-14 text-black mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 3h3l2.5 11h10l2-8H7" />
                            <circle cx="9" cy="18.5" r="1.5" fill="currentColor" />
                            <circle cx="16" cy="18.5" r="1.5" fill="currentColor" />
                            <circle cx="17.5" cy="12.5" r="4.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="17.5" y1="10.5" x2="17.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="17.5" cy="14.5" r="0.5" fill="currentColor" />
                          </svg>
                          <p className="text-[13px] font-bold text-gray-800 leading-normal max-w-[200px]">
                            You have no items in your shopping cart.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden ml-1 p-1.5 text-white/70 hover:text-white transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-in panel */}
          <div className={`absolute top-0 bottom-0 w-[320px] max-w-full bg-[#111111] flex flex-col ${locale === "ar" ? "left-0 animate-slide-in-left" : "right-0 animate-slide-in-right"}`}>

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 h-[70px] border-b border-white/10 flex-shrink-0">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo/power tire-12.webp"
                  alt="PowerTyre"
                  className="h-9 w-auto object-contain"
                />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3 bg-white/8 rounded-xl px-4 py-3 border border-white/10">
                <Search size={15} className="text-white/40 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products…"
                  className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-white/30"
                />
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-5 py-4">
              {categories.map((item) => (
                <Link
                  key={item.uid}
                  href={localiseHref(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between py-3.5 border-b border-white/10 text-[15px] font-medium transition-colors ${pathname.replace(/^\/[a-z]{2}\//, "/").startsWith(item.href.replace(/^\/[a-z]{2}\//, "/"))
                    ? "text-white"
                    : "text-white/65 hover:text-white"
                    }`}
                >
                  {item.label}
                  {!!item.children?.length && (
                    <ChevronDown size={16} className="text-white/35 flex-shrink-0" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Panel footer */}
            <div className="px-5 py-5 border-t border-white/10 flex flex-col gap-2.5 flex-shrink-0">
              <button
                onClick={() => { switchLocale(); setMobileOpen(false); }}
                className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-white/60 hover:text-white bg-white/8 hover:bg-white/12 rounded-xl transition-colors border border-white/10"
              >
                <span>{switchLabel}</span>
                <span className="text-sm leading-none">{locale === "en" ? "🇸🇦" : "🇬🇧"}</span>
              </button>
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-white/60 hover:text-white bg-white/8 hover:bg-white/12 rounded-xl transition-colors border border-white/10"
              >
                <User size={15} /> My Account
              </Link>
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 py-3.5 bg-[#ed1c24] hover:bg-[#c6181d] text-white text-sm font-bold rounded-full transition-colors"
              >
                <ShoppingBag size={16} /> View Cart
                {cartCount > 0 && (
                  <span className="ml-0.5 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Item Removal Confirmation Modal */}
      {itemToRemove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
          <div className="bg-white rounded-lg shadow-2xl max-w-[540px] w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Close button X */}
            <button
              onClick={() => setItemToRemove(null)}
              className={`absolute top-4 ${locale === "ar" ? "left-4" : "right-4"} text-gray-400 hover:text-gray-600 transition-colors focus:outline-none`}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {/* Modal body */}
            <div className="pt-12 pb-6 px-8 text-center">
              <p className="text-[15.5px] font-semibold text-gray-800 leading-normal">
                {locale === "ar"
                  ? "هل أنت متأكد أنك تريد إزالة هذا المنتج من عربة التسوق؟"
                  : "Are you sure you would like to remove this item from the shopping cart?"}
              </p>
            </div>

            {/* Modal footer / Actions */}
            <div className="pb-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setItemToRemove(null)}
                className="px-8 py-2.5 bg-[#ed1c24] hover:bg-[#d61820] text-white text-[13px] font-bold uppercase rounded-md transition-colors min-w-[110px] focus:outline-none"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={async () => {
                  if (itemToRemove) {
                    await removeItem(itemToRemove);
                    setItemToRemove(null);
                  }
                }}
                className="px-8 py-2.5 bg-black hover:bg-neutral-800 text-white text-[13px] font-bold uppercase rounded-md transition-colors min-w-[110px] focus:outline-none"
              >
                {locale === "ar" ? "موافق" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
