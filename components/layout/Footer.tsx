"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Phone, Mail, Clock, MapPin } from "lucide-react";
import { APP_CONFIG } from "@/src/config/app-config";

type SocialLink = { social_type: string; url: string };

/** Tyres category UID — centralized, not hardcoded per link. */
const TYRES_UID = APP_CONFIG.magento.tyresCategoryUid;

// Custom SVG Icons for WhatsApp, Snapchat, TikTok, Facebook, Instagram, X
const WhatsAppIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.115-2.89-6.984C16.279 1.89 13.802 1.865 11.2 1.865c-5.437 0-9.863 4.421-9.868 9.868-.001 1.714.452 3.39 1.31 4.877L1.625 21.82l5.022-1.317zm11.393-5.263c-.3-.149-1.772-.875-2.046-.975-.274-.1-.474-.149-.674.15-.2.299-.774.974-.949 1.173-.175.2-.35.224-.65.075-.3-.15-1.263-.465-2.403-1.485-.888-.793-1.488-1.77-1.663-2.07-.175-.3-.019-.461.13-.61.135-.133.3-.349.45-.523.15-.174.2-.299.3-.499.1-.2.05-.375-.025-.524-.075-.15-.675-1.625-.925-2.225-.244-.589-.491-.51-.674-.519-.174-.009-.374-.01-.574-.01-.2 0-.525.075-.8.374-.275.299-1.05 1.024-1.05 2.5 0 1.475 1.075 2.9 1.225 3.1.15.2 2.11 3.22 5.116 4.52.716.31 1.274.496 1.71.636.72.228 1.376.196 1.894.118.578-.087 1.772-.724 2.022-1.424.25-.699.25-1.299.175-1.424-.075-.125-.275-.199-.575-.349z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const SnapchatIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12 .05c-3.15 0-5.8 2-6.52 4.88-.13.5-.04 1.13.25 1.48.56.66 1.36.95 2.21.93.18 0 .36-.04.53-.1.14-.06.24-.18.25-.33.02-.27.1-.64.29-.82.68-.68 1.77-.96 2.72-.96 1.04 0 2.06.32 2.76 1.07.16.17.26.47.28.73.02.16.12.3.28.36.17.06.36.1.54.1.84.02 1.63-.26 2.2-.9.31-.35.4-.98.27-1.48-.73-2.88-3.37-4.88-6.52-4.88zm-.01 10.95c-.32 0-.64-.04-.94-.12-.35-.1-.7-.35-.8-.7-.1-.36-.03-.84.21-1.13.43-.51 1.04-.73 1.69-.72.63 0 1.25.21 1.68.72.24.29.31.77.21 1.13-.1.35-.45.6-.8.7-.3.08-.62.12-.94.12zm.01 2c-2.32 0-4.48-.48-6.07-1.34a1.86 1.86 0 01-.89-1.28c-.12-.66.13-1.46.68-1.92.5-.42 1.18-.53 1.81-.55.22 0 .42.06.58.2.14.12.2.3.17.48a3.17 3.17 0 00-.06.74c.03.62.29 1.17.76 1.5.8.56 1.88.75 2.84.75.95 0 2.03-.19 2.83-.75.47-.33.73-.88.76-1.5.01-.24-.01-.49-.06-.74-.03-.18.03-.36.17-.48.16-.14.36-.2.58-.2.63.02 1.31.13 1.81.55.55.46.8 1.26.68 1.92-.1.54-.42 1.03-.89 1.28-1.59.86-3.75 1.34-6.07 1.34zm0 2c-3.11 0-6.14-.8-8.21-2.26a1.9 1.9 0 01-.79-1.48c-.06-.88.42-1.89 1.26-2.43a4.7 4.7 0 012.35-.76c.26 0 .5.09.68.27.17.18.23.44.18.68-.08.41-.12.87-.1 1.28.05 1.16.63 2.12 1.55 2.68 1.34.82 3.17 1.08 4.78 1.08 1.6 0 3.44-.26 4.78-1.08.92-.56 1.5-1.52 1.55-2.68.02-.41-.02-.87-.1-1.28-.05-.24.01-.5.18-.68.18-.18.42-.27.68-.27a4.7 4.7 0 012.35.76c.84.54 1.32 1.55 1.26 2.43a1.9 1.9 0 01-.79 1.48c-2.07 1.46-5.1 2.26-8.21 2.26zm0 1.92c.6 0 1.2-.03 1.79-.09.31-.03.62-.17.82-.41.34-.41.35-1.01.27-1.52-.07-.44-.2-.88-.4-1.28a1 1 0 01.12-1.09c.47-.56.9-.9 1.32-1.32a6.4 6.4 0 001.32-1.79c.2-.38.27-.83.18-1.26a1.9 1.9 0 00-1.26-1.42c-.52-.18-1.09-.23-1.64-.13-.26.05-.53 0-.74-.15a1.86 1.86 0 01-.68-1.12c-.22-.73-.78-1.32-1.5-1.58-.78-.28-1.64-.28-2.42 0a2.2 2.2 0 00-1.5 1.58 1.86 1.86 0 01-.68 1.12c-.21.15-.48.2-.74.15-.55-.1-1.12-.05-1.64.13A1.9 1.9 0 003.5 5.51c-.09.43-.02.88.18 1.26a6.4 6.4 0 001.32 1.79c.42.42.85.76 1.32 1.32.22.26.27.62.12 1.09-.2.4-.33.84-.4 1.28-.08.51-.07 1.11.27 1.52.2.24.51.38.82.41.59.06 1.19.09 1.79.09z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.5-4.09-1.36-.32-.23-.62-.5-.9-.79v6.2c.01 2.03-.54 4.14-2.02 5.55-1.52 1.49-3.79 2.19-5.88 1.84-2.12-.32-4.07-1.67-5.06-3.59-1.22-2.3-.94-5.31.76-7.31 1.53-1.85 4.09-2.6 6.38-1.92v4.09c-1.36-.45-2.97-.13-3.99.87-.94.9-.11 2.82.68 3.19.82.41 1.88.35 2.58-.29.62-.57.69-1.52.68-2.33-.02-3.64-.01-7.29-.02-10.93.01-.15.01-.3.01-.45z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const EXPLORE_TIRES = [
  { label: "Off Road Tires", href: `/shop?categoryUid=${TYRES_UID}&tyre_type=Off+Road` },
  { label: "On Road Tires", href: `/shop?categoryUid=${TYRES_UID}&tyre_type=On+Road` },
  { label: "Run Flat Tires", href: `/shop?categoryUid=${TYRES_UID}&runflat=RunFlat` },
  { label: "EV Tires", href: `/shop?categoryUid=${TYRES_UID}&ev=EV` }
];

const PREMIUM_TIRE = [
  { label: "Pirelli", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=pirelli` },
  { label: "Michelin", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=michelin` },
  { label: "Continental", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=continental` },
  { label: "Bridgestone", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=bridgestone` },
  { label: "BFGoodrich", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=bfgoodrich` },
  { label: "Goodyear", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=goodyear` },
  { label: "Kumho", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=kumho` },
  { label: "Hankook", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=hankook` },
  { label: "Yokohama", href: `/shop?categoryUid=${TYRES_UID}&mgs_brand=yokohama` }
];

const WHY_POWERTIRE = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Special Offers", href: "/#offers" },
  { label: "Track Order", href: "/track-order" },
  { label: "Tires", href: "/shop" },
  { label: "Contact", href: "/contact" }
];

const OUR_POLICIES = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Offers Terms and Conditions", href: "/offers-terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Warranty", href: "/warranty" },
  { label: "Returns & Refund", href: "/returns-refund" },
  { label: "VAT Certificate", href: "/vat-certificate" }
];

// Fallback social links used when mpSocialUrls backend is unavailable
const SOCIAL_FALLBACK: SocialLink[] = [
  { social_type: "facebook",  url: "https://facebook.com" },
  { social_type: "instagram", url: "https://instagram.com" },
  { social_type: "snapchat",  url: "https://snapchat.com" },
  { social_type: "tiktok",    url: "https://tiktok.com" },
  { social_type: "twitter",   url: "https://x.com/PowerTireksa" },
];

function SocialIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case "facebook":  return <FacebookIcon />;
    case "instagram": return <InstagramIcon />;
    case "snapchat":  return <SnapchatIcon />;
    case "tiktok":    return <TikTokIcon />;
    case "twitter":   return <XIcon />;
    case "youtube":   return <XIcon />;  // placeholder until YouTube icon is added
    case "whatsapp":  return <WhatsAppIcon />;
    default:          return null;
  }
}

export default function Footer() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(SOCIAL_FALLBACK);

  useEffect(() => {
    fetch("/api/social")
      .then(r => r.json())
      .then((d: { links?: SocialLink[] }) => {
        if (d.links && d.links.length > 0) setSocialLinks(d.links);
        // if empty (backend bug), keep SOCIAL_FALLBACK
      })
      .catch(() => {/* keep fallback */});
  }, []);

  const exploreTires = [
    { label: "Off Road Tires", href: `/${locale}/off-road-tires-4x4` },
    { label: "On Road Tires", href: `/${locale}/on-road-tires` },
    { label: "Run Flat Tires", href: `/${locale}/run-flat-tires` },
    { label: "EV Tires", href: `/${locale}/ev-tires` }
  ];

  return (
    <footer className="bg-[#0a0a0a] text-white/80 font-sans border-t border-neutral-900">
      <div className="container max-w-[1380px] mx-auto px-4 py-16 lg:py-20">

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">

          {/* Column 1: Brand Logo + Contact + Follow Us */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Link href="/" className="inline-block w-fit">
              <img
                src="/logo/power tire-12.webp"
                alt="PowerTire.sa Logo"
                className="h-11 w-auto object-contain brightness-0 invert"
              />
            </Link>

            {/* Get In Touch */}
            <div>
              <h3 className="text-[#ed1c24] font-black uppercase text-sm mb-4 tracking-wider">
                GET IN TOUCH
              </h3>
              <ul className="flex flex-col gap-3.5 text-xs text-white/80 font-medium">
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <a href="tel:920017534" className="hover:text-[#ed1c24] transition-colors">920017534</a>
                </li>
                <li className="flex items-center gap-3">
                  <WhatsAppIcon />
                  <a href="https://wa.me/920017534" target="_blank" rel="noopener noreferrer" className="hover:text-[#ed1c24] transition-colors">920017534</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400 shrink-0" />
                  <a href="mailto:customercare@powertire.sa" className="hover:text-[#ed1c24] transition-colors">customercare@powertire.sa</a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="leading-relaxed">
                    <p>Sat to Thu: 9:00 am - 6:00 pm</p>
                    <p>Friday: 2:00 pm - 11:00 pm</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">
                    Building Number 7240, King Fahd Branch Road, 4443 , Al Malqa District, Postal Code: 13524, Riyadh, Saudi Arabia
                  </span>
                </li>
              </ul>
            </div>

            {/* Follow Us */}
            <div>
              <h3 className="text-[#ed1c24] font-black uppercase text-sm mb-4 tracking-wider">
                FOLLOW US
              </h3>
              <div className="flex gap-3 text-white/70">
                {socialLinks.map((link) => {
                  const icon = <SocialIcon type={link.social_type} />;
                  if (!icon) return null;
                  return (
                    <a
                      key={link.social_type}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#ed1c24] transition-colors"
                      aria-label={link.social_type}
                    >
                      {icon}
                    </a>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Column 2: Explore Tires */}
          <div>
            <h3 className="text-[#ed1c24] font-black uppercase text-sm mb-5 tracking-wider">
              EXPLORE TIRES
            </h3>
            <ul className="flex flex-col gap-3 text-xs sm:text-[13px] text-white/70 font-semibold">
              {exploreTires.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Premium Tire */}
          <div>
            <h3 className="text-[#ed1c24] font-black uppercase text-sm mb-5 tracking-wider">
              PREMIUM TIRE
            </h3>
            <ul className="flex flex-col gap-3 text-xs sm:text-[13px] text-white/70 font-semibold">
              {PREMIUM_TIRE.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Why PowerTire.sa */}
          <div>
            <h3 className="text-[#ed1c24] font-black uppercase text-sm mb-5 tracking-wider">
              WHY POWERTIRE.SA
            </h3>
            <ul className="flex flex-col gap-3 text-xs sm:text-[13px] text-white/70 font-semibold">
              {WHY_POWERTIRE.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Our Policies + SBC Verified */}
          <div className="flex flex-col justify-between h-full">
            <div>
              <h3 className="text-[#ed1c24] font-black uppercase text-sm mb-5 tracking-wider">
                OUR POLICIES
              </h3>
              <ul className="flex flex-col gap-3 text-xs sm:text-[13px] text-white/70 font-semibold">
                {OUR_POLICIES.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verified on SBC */}
            <div className="mt-8 pt-4">
              <a
                href="https://eauthenticate.saudibusiness.gov.sa/certificate-details/0000202551"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-800/60"
              >
                <span className="text-[11px] font-bold text-white/80 tracking-wide">Verified on SBC</span>
                <img
                  src="https://powertire.klever.ae/media/images/sbc.webp"
                  alt="SBC Verified Logo"
                  className="h-6 w-auto object-contain"
                />
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Copyright Bar */}
      <div className="bg-black py-5 border-t border-neutral-900 text-white/50 text-[11px] sm:text-xs">
        <div className="container max-w-[1380px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-5">

          {/* Copyright text */}
          <div className="font-medium text-center md:text-left">
            <span>Copyright © 2026 All rights reserved by PowerTire.sa.</span>
          </div>

          {/* Bottom links */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 font-bold text-white/70">
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <span>/</span>
            <Link href="/track-order" className="hover:text-white transition-colors">Track Order</Link>
            <span>/</span>
            <Link href="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
            <span>/</span>
            <Link href="/frequently-asked-questions" className="hover:text-white transition-colors">FAQs</Link>
            <span>/</span>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>

          {/* Payment gateway icons */}
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <img src="https://powertire.klever.ae/media/images/mada_mini.webp" alt="Mada" className="h-4 sm:h-5 w-auto object-contain" />
            <img src="https://powertire.klever.ae/media/images/credit_card_mini.webp" alt="Visa / Mastercard" className="h-4 sm:h-5 w-auto object-contain" />
            <img src="https://powertire.klever.ae/media/images/stc_pay_mini.webp" alt="STC Pay" className="h-4 sm:h-5 w-auto object-contain" />
            <img src="https://powertire.klever.ae/media/images/apple_pay_mini.webp" alt="Apple Pay" className="h-4 sm:h-5 w-auto object-contain" />
            <img src="https://powertire.klever.ae/media/images/footer-tabby.webp" alt="Tabby" className="h-4 sm:h-5 w-auto object-contain" />
            <img src="https://powertire.klever.ae/media/images/card-icon.webp" alt="Tamara" className="h-4 sm:h-5 w-auto object-contain" />
          </div>

        </div>
      </div>
    </footer>
  );
}
