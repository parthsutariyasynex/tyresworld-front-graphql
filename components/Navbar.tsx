"use client";

import { useState } from "react";
import { ShoppingBag, Search, Menu, X, User } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "/collections" },
  { label: "Stories", href: "/stories" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-ink/5">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-1">
            <span className="font-display text-2xl tracking-tight text-ink">
              Maison
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent mb-1 self-end" />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-ink/60 hover:text-ink transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              aria-label="Search"
              className="p-2 rounded-full hover:bg-cream transition-colors"
            >
              <Search size={18} />
            </button>
            <button
              aria-label="Account"
              className="p-2 rounded-full hover:bg-cream transition-colors hidden sm:flex"
            >
              <User size={18} />
            </button>
            <button
              aria-label="Cart"
              className="relative p-2 rounded-full hover:bg-cream transition-colors"
            >
              <ShoppingBag size={18} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                2
              </span>
            </button>
            <button
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-cream transition-colors md:hidden ml-1"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink/5 bg-white">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 text-sm font-medium text-ink/70 hover:text-ink hover:bg-cream rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 pt-3 border-t border-ink/5">
              <a
                href="/account"
                className="px-3 py-3 text-sm font-medium text-ink/70 hover:text-ink hover:bg-cream rounded-xl transition-colors flex items-center gap-2"
              >
                <User size={15} /> Account
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
