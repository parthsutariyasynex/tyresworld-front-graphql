"use client";

import { useState, useEffect, useRef } from "react";
import { useScrollLock } from "@/lib/useScrollLock";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Money } from "@/components/Price";
import { MAIN_NAV, navHref, navLabel, isNavActive } from "@/src/config/navigation";
import HomeSearchBar from "@/components/home/partora/HomeSearchBar";

/* Icon-button styles live in app/globals.css (.header-icon-*) — the one
   stylesheet is the single source of truth for brand colours. */
const ICON_BTN = "header-icon-dark";

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { count: cartCount, items, currency, removeItem, updateQty } = useCart();

  const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const nextLocale = locale === "ar" ? "en" : "ar";
  const switchLabel = locale === "en" ? "العربية" : "English";

  const isHomePage = pathname === "/" || pathname === `/${locale}` || pathname === `/${locale}/` || pathname === "/en" || pathname === "/ar";

  function switchLocale() {
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const nextPath = segments.join("/");
    const qs = searchParams.toString();
    router.push(`${nextPath}${qs ? `?${qs}` : ""}`);
  }

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSubOpen, setMobileSubOpen] = useState<string | null>(null);
  const { customer, isLoggedIn, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const totalItemSums = items.reduce((acc, item) => acc + item.prices.row_total.value, 0);
  const subtotalExclTax = totalItemSums / 1.15;
  const fmtMoney = (v: number) => <Money value={v} currency={currency} digits={2} />;

  useScrollLock(mobileOpen);

  /* ── Close everything on route change ───────────────────────── */
  useEffect(() => {
    setMobileOpen(false);
    setMobileSubOpen(null);
    setOpenDropdown(null);
    setCartDropdownOpen(false);
    setAccountDropdownOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          DESKTOP HEADER
      ══════════════════════════════════════════════════════════ */}
      <header className="site-header">
        <div className="site-header-inner">

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link
            href={`/${locale}`}
            className="site-header-logo flex-shrink-0 flex items-center"
            aria-label="Tyresworld home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/tires-logo-white.png"
              alt="Tyresworld"
              width={232}
              height={70}
              className="h-[38px] sm:h-[44px] w-auto object-contain"
            />
          </Link>

          {/* ── Homepage Search Bar (Centered on Homepage) ─────────────── */}
          {isHomePage && (
            <div className="hidden md:flex flex-1 max-w-[650px] mx-4 lg:mx-8">
              <HomeSearchBar locale={locale} />
            </div>
          )}

          {/* ── Primary nav (Shown on inner pages, hidden on homepage) ─── */}
          {!isHomePage && (
            <nav className="site-nav">
              {MAIN_NAV.map((item) => {
                const hasChildren = !!item.children?.length;
                const isActive = isNavActive(item, pathname, locale);
                const isOpen = openDropdown === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative group h-full flex items-center"
                    onMouseEnter={() => hasChildren && setOpenDropdown(item.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={navHref(item, locale)}
                      className="site-nav-link"
                      data-active={isActive}
                    >
                      <span>{navLabel(item, locale)}</span>
                      {hasChildren && (
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 opacity-70 group-hover:opacity-100 ${
                            isOpen ? "rotate-180 text-[#ed1c24]" : ""
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </Link>

                    {/* Dropdown panel for items with children */}
                    {hasChildren && (
                      <div
                        className="site-nav-panel"
                        data-open={isOpen}
                        style={{
                          [locale === "ar" ? "right" : "left"]: 0,
                        }}
                      >
                        <div className="site-nav-panel-body rounded-b-xl shadow-2xl">
                          {item.children!.map((child) => (
                            <Link
                              key={child.id}
                              href={navHref(child, locale)}
                              className="site-nav-sublink"
                              data-active={isNavActive(child, pathname, locale)}
                              onClick={() => setOpenDropdown(null)}
                            >
                              {navLabel(child, locale)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          {/* ── Right actions ─────────────────────────────── */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto lg:ml-0 relative">

              {/* Language / store switcher (commented out - English only)
              <button
                onClick={switchLocale}
                className="hidden lg:flex items-center gap-1.5 text-[#111111]/60 hover:text-[#ed1c24] text-[13px] font-semibold transition-colors"
                aria-label={`Switch to ${nextLocale === "ar" ? "Arabic" : "English"}`}
              >
                <span>{switchLabel}</span>
                <span className="text-sm leading-none">{locale === "en" ? "🇸🇦" : "🇬🇧"}</span>
              </button>

              <span className="hidden lg:block w-px h-5 bg-black/15 mx-0.5" />
              */}

              {/* Cart Dropdown wrapper (First) */}
              <div
                className="relative"
                onMouseEnter={() => setCartDropdownOpen(true)}
                onMouseLeave={() => setCartDropdownOpen(false)}
              >
                <Link
                  href="/cart"
                  className="header-icon-dark relative"
                  aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
                >
                  <ShoppingCart size={22} className="stroke-[2.2]" />
                  {cartCount > 0 && (
                    <span className="header-cart-badge">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Dropdown panel */}
                {cartDropdownOpen && (
                  <div className="absolute right-0 top-full pt-2 w-[350px] sm:w-[370px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 text-left overflow-hidden">
                      {cartCount > 0 ? (
                        <>
                          {/* Header: X Items in Cart */}
                          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-[#ed1c24]">
                                <ShoppingBag size={14} strokeWidth={2.5} />
                              </div>
                              <span className="font-black text-xs sm:text-[13px] text-gray-950 tracking-tight">
                                {cartCount} {cartCount === 1 ? (locale === "ar" ? "منتج في السلة" : "Item in Cart") : (locale === "ar" ? "منتجات في السلة" : "Items in Cart")}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCartDropdownOpen(false)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                              aria-label="Close"
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="flex justify-between items-center px-4 sm:px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 text-xs">
                            <span className="font-semibold text-gray-500">
                              {locale === "ar" ? "المجموع الجزئي" : "Cart Subtotal"}
                            </span>
                            <span className="font-black text-sm text-gray-950 tabular-nums">
                              {fmtMoney(subtotalExclTax)}
                            </span>
                          </div>

                          {/* Items List */}
                          <div className="max-h-[270px] overflow-y-auto divide-y divide-gray-100/80 px-4 py-1 custom-scrollbar">
                            {items.map((item) => {
                              const productUrl = `/${locale}/product/${item.product.url_key ?? item.product.sku}`;
                              return (
                                <div key={item.uid} className="py-2.5 flex gap-2.5 items-center group">
                                  <Link
                                    href={productUrl}
                                    onClick={() => setCartDropdownOpen(false)}
                                    className="w-11 h-11 bg-[#fafafa] border border-gray-150 rounded-lg overflow-hidden p-1 flex items-center justify-center shrink-0 group-hover:border-[#ed1c24]/30 transition-colors"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={item.product.thumbnail?.url ?? ""}
                                      alt={item.product.name}
                                      className="object-contain w-full h-full drop-shadow-2xs"
                                    />
                                  </Link>
                                  <div className="flex-1 min-w-0">
                                    <Link
                                      href={productUrl}
                                      onClick={() => setCartDropdownOpen(false)}
                                      className="text-xs font-black text-gray-950 hover:text-[#ed1c24] transition-colors leading-snug line-clamp-2"
                                    >
                                      {item.product.name}
                                    </Link>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-xs font-black text-[#ed1c24] tabular-nums">
                                        {fmtMoney(item.prices.price.value)}
                                      </span>
                                    </div>

                                    {/* Qty and Delete */}
                                    <div className="flex items-center justify-between mt-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">QTY</span>
                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (item.quantity > 1) {
                                                updateQty(item.uid, item.quantity - 1);
                                              } else {
                                                setItemToRemove(item.uid);
                                              }
                                            }}
                                            className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-200/70 transition-colors cursor-pointer"
                                            aria-label="Decrease quantity"
                                          >
                                            <Minus size={11} strokeWidth={2.5} />
                                          </button>
                                          <span className="w-6 text-center font-bold text-xs text-gray-950 tabular-nums">
                                            {item.quantity}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => updateQty(item.uid, item.quantity + 1)}
                                            className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-200/70 transition-colors cursor-pointer"
                                            aria-label="Increase quantity"
                                          >
                                            <Plus size={11} strokeWidth={2.5} />
                                          </button>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => setItemToRemove(item.uid)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                        aria-label="Remove item"
                                        title={locale === "ar" ? "حذف" : "Remove"}
                                      >
                                        <Trash2 size={13} strokeWidth={2.2} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* View and Edit Cart Button */}
                          <div className="p-4 bg-white border-t border-gray-100">
                            <Link
                              href={`/${locale}/cart`}
                              onClick={() => setCartDropdownOpen(false)}
                              className="btn-cta w-full text-xs py-3.5 rounded-xl shadow-md"
                            >
                              <span>{locale === "ar" ? "عرض وتعديل السلة" : "VIEW AND EDIT CART"}</span>
                              <ArrowRight size={14} strokeWidth={2.5} className={locale === "ar" ? "rotate-180" : ""} />
                            </Link>
                          </div>
                        </>
                      ) : (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-9 px-4 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                            <ShoppingBag size={24} strokeWidth={1.75} />
                          </div>
                          <p className="text-sm font-black text-gray-900 mb-1">
                            {locale === "ar" ? "سلة التسوق فارغة" : "Your cart is empty"}
                          </p>
                          <p className="text-xs text-gray-500 max-w-[200px] mb-4">
                            {locale === "ar" ? "لم تقم بإضافة أي إطارات بعد." : "Browse our catalogue and find the best tyres."}
                          </p>
                          <Link
                            href={`/${locale}/tyres`}
                            onClick={() => setCartDropdownOpen(false)}
                            className="bg-gray-950 hover:bg-[#ed1c24] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            {locale === "ar" ? "تصفح الإطارات" : "START SHOPPING"}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Account Dropdown Wrapper (Second) */}
              <div
                className="relative hidden sm:block"
                onMouseEnter={() => setAccountDropdownOpen(true)}
                onMouseLeave={() => setAccountDropdownOpen(false)}
              >
                <Link
                  href="/account"
                  className="header-icon-dark"
                  aria-label="My account"
                >
                  <User size={22} className="stroke-[2.2]" />
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

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden ml-1 p-1.5 text-ink hover:text-brand-red transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
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
          <div className={`drawer-panel ${locale === "ar" ? "left-0 animate-slide-in-left" : "right-0 animate-slide-in-right"}`}>

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 h-[70px] border-b border-white/10 flex-shrink-0">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo/tires-logo-white.png"
                  alt="Tyresworld"
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
              {MAIN_NAV.map((item) => {
                const hasChildren = !!item.children?.length;
                const isActive = isNavActive(item, pathname, locale);
                const isExpanded = mobileSubOpen === item.id;

                return (
                  <div key={item.id} className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <Link
                        href={navHref(item, locale)}
                        onClick={() => setMobileOpen(false)}
                        className="drawer-link"
                        data-active={isActive}
                      >
                        {navLabel(item, locale)}
                      </Link>

                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => setMobileSubOpen(isExpanded ? null : item.id)}
                          className="w-9 h-9 -mr-1.5 flex items-center justify-center text-white/45 hover:text-white transition-colors"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.label}`}
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Sub-menu accordion */}
                    {hasChildren && isExpanded && (
                      <ul className={`pb-2 ${locale === "ar" ? "pr-3 border-r-2" : "pl-3 border-l-2"} border-white/10`}>
                        {item.children!.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={navHref(child, locale)}
                              onClick={() => setMobileOpen(false)}
                              className="drawer-sublink"
                              data-active={isNavActive(child, pathname, locale)}
                            >
                              {navLabel(child, locale)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Panel footer */}
            <div className="px-5 py-5 border-t border-white/10 flex flex-col gap-2.5 flex-shrink-0">
              {/* Language / store switcher (commented out - English only)
              <button
                onClick={() => { switchLocale(); setMobileOpen(false); }}
                className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-white/60 hover:text-white bg-white/8 hover:bg-white/12 rounded-xl transition-colors border border-white/10"
              >
                <span>{switchLabel}</span>
                <span className="text-sm leading-none">{locale === "en" ? "🇸🇦" : "🇬🇧"}</span>
              </button>
              */}
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
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200" dir={locale === "ar" ? "rtl" : "ltr"}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-[480px] w-full p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 text-center">
            {/* Close button X */}
            <button
              onClick={() => setItemToRemove(null)}
              className={`absolute top-4 ${locale === "ar" ? "left-4" : "right-4"} w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer`}
              aria-label="Close dialog"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Trash icon illustration */}
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#ed1c24] flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} strokeWidth={2.2} />
            </div>

            {/* Modal title & body */}
            <h3 className="text-base sm:text-lg font-black text-gray-950 mb-2">
              {locale === "ar" ? "إزالة المنتج من السلة؟" : "Remove Item from Cart?"}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed max-w-[360px] mx-auto mb-6">
              {locale === "ar"
                ? "هل أنت متأكد من رغبتك في إزالة هذا المنتج من عربة التسوق؟"
                : "Are you sure you want to remove this item from your shopping cart?"}
            </p>

            {/* Modal footer / Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setItemToRemove(null)}
                className="flex-1 py-3 px-5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (itemToRemove) {
                    await removeItem(itemToRemove);
                    setItemToRemove(null);
                  }
                }}
                className="btn-cta flex-1 py-3 px-5 rounded-xl shadow-md text-xs"
              >
                <span>{locale === "ar" ? "حذف" : "Remove"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
