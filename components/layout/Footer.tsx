"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Instagram, Twitter, Youtube, Facebook, ArrowRight } from "lucide-react";

type FooterLink = { label: string; href: string };

const companyLinks: FooterLink[] = [
  { label: "Our Story", href: "/about" },
  { label: "Sustainability", href: "#" },
  { label: "Press", href: "#" },
  { label: "Careers", href: "#" },
];
const supportLinks: FooterLink[] = [
  { label: "FAQ", href: "#" },
  { label: "Shipping & Returns", href: "#" },
  { label: "Track Order", href: "#" },
  { label: "Contact Us", href: "/contact" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Shop column comes from the GraphQL category menu (same source as the header).
  const [shopLinks, setShopLinks] = useState<FooterLink[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/menu")
      .then((r) => r.json())
      .then((json) => {
        if (!active || !Array.isArray(json.menu)) return;
        setShopLinks(json.menu.map((c: FooterLink) => ({ label: c.label, href: c.href })));
      })
      .catch(() => {/* leave empty */});
    return () => { active = false; };
  }, []);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  }

  return (
    <footer className="bg-ink text-white/60">
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 lg:gap-12 mb-14">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-1 mb-5">
              <span className="font-display text-2xl tracking-tight text-white">
                Maison
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent mb-1 self-end" />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs mb-7">
              Considered goods designed for the way you actually live. Premium
              materials, timeless forms — no compromises.
            </p>

            {/* Social */}
            <div className="flex gap-2">
              {[
                { Icon: Instagram, label: "Instagram" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Youtube, label: "YouTube" },
                { Icon: Facebook, label: "Facebook" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Shop", links: shopLinks },
            { title: "Company", links: companyLinks },
            { title: "Support", links: supportLinks },
          ].map(({ title, links }) => (
            <div key={title} className="col-span-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-white mb-5">
                {title}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white mb-2">
              Stay in the loop
            </p>
            <p className="text-sm mb-5">
              New arrivals and exclusive offers, twice a month. No spam.
            </p>
            {subscribed ? (
              <p className="text-sm text-accent font-medium">
                You&apos;re subscribed — thank you!
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 min-w-0 bg-white/8 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:brightness-95 transition-all"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={16} className="text-white" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
          <p>© 2026 Maison. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
