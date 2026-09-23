"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useOverviewDrawer } from "@/lib/overview-drawer-context";
import { useScrollLock } from "@/lib/useScrollLock";
import { Money } from "@/components/Price";
import { navHref, navLabel, isNavActive, type NavItem } from "@/src/config/navigation";
import HomeSearchBar from "@/components/home/partora/HomeSearchBar";
import HeaderSearchModal from "@/components/search/HeaderSearchModal";

/* Icon-button styles live in app/globals.css (.header-icon-*) — the one
   stylesheet is the single source of truth for brand colours. */
const ICON_BTN = "header-icon-dark";

export default function Header({ menu = [] }: { menu?: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count: cartCount, items, currency, removeItem, updateQty, cart } = useCart();
  const { openDrawer: openOverview } = useOverviewDrawer();

  const locale = "en";

  const isHomePage = pathname === "/" || pathname === `/${locale}` || pathname === `/${locale}/`;

  const [mobileOpen, setMobileOpen] = useState(false);
  useScrollLock(mobileOpen);
  const [mobileSubOpen, setMobileSubOpen] = useState<string | null>(null);
  const { customer, isLoggedIn, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  // Real cart subtotal (tax-excluding) straight from Magento; row_total is
  // already tax-exclusive, so no hardcoded VAT-rate math is ever needed.
  const totalItemSums = items.reduce((acc, item) => acc + item.prices.row_total.value, 0);
  const subtotalExclTax = cart?.prices?.subtotal_excluding_tax?.value ?? totalItemSums;
  const fmtMoney = (v: number) => <Money value={v} currency={currency} digits={2} />;

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
              className="h-[20px] min-[400px]:h-[26px] sm:h-[32px] xl:h-[36px] 2xl:h-[42px] w-auto object-contain shrink-0"
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
              {menu.map((item) => {
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
                        style={{ left: 0 }}
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
            <div className="flex items-center gap-1 xl:gap-1.5 2xl:gap-2 flex-shrink-0 ml-auto xl:ml-0 relative">

              {/* 1. Search Icon Button (First) */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="header-icon-dark cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5 xl:w-[21px] xl:h-[21px] 2xl:w-[22px] 2xl:h-[22px] stroke-[2.2]" />
              </button>

              {/* 2. Account Dropdown Wrapper (Second) */}
              <div
                className="relative"
                onMouseEnter={() => setAccountDropdownOpen(true)}
                onMouseLeave={() => setAccountDropdownOpen(false)}
              >
                <Link
                  href="/account"
                  className="header-icon-dark"
                  aria-label="My account"
                >
                  <User className="w-5 h-5 xl:w-[21px] xl:h-[21px] 2xl:w-[22px] 2xl:h-[22px] stroke-[2.2]" />
                </Link>

                {/* Dropdown panel */}
                {accountDropdownOpen && isLoggedIn && (
                  <div className="absolute right-0 top-full pt-1.5 w-[220px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-md shadow-2xl border border-gray-100 p-4 text-left">
                      <div className="flex flex-col gap-2.5">
                        <div className="border-b border-gray-100 pb-2">
                          <p className="text-[10px] uppercase font-bold text-gray-400">
                            Welcome
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
                          MY ACCOUNT
                        </Link>
                        <Link
                          href="/account?tab=wishlist"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="text-[12px] font-bold text-gray-700 hover:text-[#ed1c24] transition-colors"
                        >
                          MY WISHLIST
                        </Link>
                        <button
                          onClick={async () => {
                            setAccountDropdownOpen(false);
                            await logout();
                            router.push(`/${locale}`);
                          }}
                          className="w-full text-left text-[12px] font-bold text-gray-500 hover:text-[#ed1c24] transition-colors pt-2 border-t border-gray-100 cursor-pointer"
                        >
                          SIGN OUT
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Cart Dropdown wrapper (Third) */}
              <div
                className="relative"
                onMouseEnter={() => setCartDropdownOpen(true)}
                onMouseLeave={() => setCartDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCartDropdownOpen(false);
                    openOverview("cart");
                  }}
                  className="header-icon-dark relative cursor-pointer"
                  aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
                >
                  <ShoppingCart className="w-5 h-5 xl:w-[21px] xl:h-[21px] 2xl:w-[22px] 2xl:h-[22px] stroke-[2.2]" />
                  {cartCount > 0 && (
                    <span className="header-cart-badge">
                      {cartCount}
                    </span>
                  )}
                </button>

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
                                {cartCount} {cartCount === 1 ? "Item in Cart" : "Items in Cart"}
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
                              Cart Subtotal
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
                                         {fmtMoney(
                                           item.prices.price_including_tax?.value ??
                                           item.prices.price?.value ??
                                           0
                                         )}
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
                                            disabled={
                                              item.product.kleverQtyOptions?.max_qty != null &&
                                              item.quantity >= item.product.kleverQtyOptions.max_qty
                                            }
                                            className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-200/70 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                                        title="Remove"
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
                            <button
                              type="button"
                              onClick={() => {
                                setCartDropdownOpen(false);
                                openOverview("cart");
                              }}
                              className="btn-cta w-full text-xs py-3.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                              <span>VIEW AND EDIT CART</span>
                              <ArrowRight size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-9 px-4 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                            <ShoppingBag size={24} strokeWidth={1.75} />
                          </div>
                          <p className="text-sm font-black text-gray-900 mb-1">
                            Your cart is empty
                          </p>
                          <p className="text-xs text-gray-500 max-w-[200px] mb-4">
                            Browse our catalogue and find the best tyres.
                          </p>
                          <Link
                            href={`/${locale}/tyres`}
                            onClick={() => setCartDropdownOpen(false)}
                            className="btn-cta text-xs font-bold px-5 py-2.5 rounded-lg"
                          >
                            START SHOPPING
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="xl:hidden header-icon-dark cursor-pointer ml-1"
                aria-label="Open menu"
              >
                <Menu size={22} className="stroke-[2.2]" />
              </button>
            </div>

        </div>
      </header>



      {/* ══════════════════════════════════════════════════════════
          MOBILE DRAWER (Smooth Slide-In & Slide-Out Transition)
      ══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-[100] xl:hidden ${
          mobileOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
        } transition-[visibility] duration-300 ease-in-out`}
        style={{
          transitionDelay: mobileOpen ? "0ms" : "300ms",
        }}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Slide-in panel */}
        <div
          className={`drawer-panel fixed top-0 bottom-0 h-full w-[300px] sm:w-[340px] max-w-[85vw] flex flex-col z-10 right-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
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
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 border border-white/10 text-white text-xs font-semibold transition-colors cursor-pointer text-start"
            >
              <Search size={16} className="text-[#ed1c24] flex-shrink-0" />
              <span className="text-white/70">Search tyre size, vehicle or brand…</span>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-5 py-4">
            {menu.map((item) => {
              const hasChildren = !!item.children?.length;
              const isActive = isNavActive(item, pathname, locale);
              const isExpanded = mobileSubOpen === item.id;

              return (
                <div key={item.id} className="border-b border-white/10">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setMobileSubOpen(isExpanded ? null : item.id)}
                      className="w-full flex items-center justify-between py-3.5 text-left text-white/80 hover:text-white transition-colors cursor-pointer group"
                      aria-expanded={isExpanded}
                    >
                      <span className={`text-[15px] font-semibold ${isActive || isExpanded ? "text-white" : ""}`}>
                        {navLabel(item, locale)}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 text-white/50 group-hover:text-white ${
                          isExpanded ? "rotate-180 text-[#ed1c24]" : ""
                        }`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={navHref(item, locale)}
                      onClick={() => setMobileOpen(false)}
                      className="drawer-link block py-3.5"
                      data-active={isActive}
                    >
                      {navLabel(item, locale)}
                    </Link>
                  )}

                  {/* Sub-menu accordion */}
                  {hasChildren && isExpanded && (
                    <ul className="pb-3 pl-3.5 pr-1 border-l-2 border-[#ed1c24]/50 my-1 space-y-1 animate-in fade-in duration-200">
                      {item.children!.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={navHref(child, locale)}
                            onClick={() => setMobileOpen(false)}
                            className="drawer-sublink block py-2 px-2 rounded-lg hover:bg-white/5 transition-colors font-medium text-[13.5px]"
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
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-white/60 hover:text-white bg-white/8 hover:bg-white/12 rounded-xl transition-colors border border-white/10"
            >
              <User size={15} /> My Account
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openOverview("cart");
              }}
              className="flex items-center justify-center gap-2 py-3.5 bg-[#ed1c24] hover:bg-[#c6181d] text-white text-sm font-bold rounded-full transition-colors cursor-pointer"
            >
              <ShoppingBag size={16} /> View Cart
              {cartCount > 0 && (
                <span className="ml-0.5 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Item Removal Confirmation Modal */}
      {itemToRemove && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[480px] w-full p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 text-center">
            {/* Close button X */}
            <button
              onClick={() => setItemToRemove(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
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
              Remove Item from Cart?
            </h3>
            <p className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed max-w-[360px] mx-auto mb-6">
              Are you sure you want to remove this item from your shopping cart?
            </p>

            {/* Modal footer / Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setItemToRemove(null)}
                className="flex-1 py-3 px-5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancel
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
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search Popup Modal (Matches Image 1) ── */}
      <HeaderSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        locale={locale}
      />
    </>
  );
}
