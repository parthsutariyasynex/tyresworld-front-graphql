"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CmsInfo = { heading: string; description: string };

// SVG Line Icons for Services
function TyreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83" />
    </svg>
  );
}

function RimIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v7M12 15v7M2 12h7M15 12h7M5.64 5.64l4.95 4.95M13.41 13.41l4.95 4.95M18.36 5.64l-4.95 4.95M10.59 10.59l-4.95 4.95" />
    </svg>
  );
}

function BatteryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M6 7V4M18 7V4M6 11h4M16 11h2M17 10v2" />
    </svg>
  );
}

function ServiceIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function MotorbikeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="5" cy="18" r="3" />
      <circle cx="19" cy="18" r="3" />
      <path d="M12 18V8M19 18v-4h-5l-4-4H5v2M12 8l4-4h3M5 18H2v-4h3" />
    </svg>
  );
}

const SERVICES = [
  {
    id: "car-tyres",
    title: "Car Tyres",
    description: "Premium selection of passenger & SUV tyres from leading global brands.",
    image: "/heropage-banner/banner1_3.jpg",
    icon: TyreIcon,
    href: "/#search",
  },
  {
    id: "rims-wheels",
    title: "Rims/Wheels",
    description: "Upgrade your ride with our stylish, high-quality alloy rims and wheels.",
    image: "/heropage-banner/banner2_2.jpg",
    icon: RimIcon,
    href: "/#search",
  },
  {
    id: "battery",
    title: "Battery",
    description: "Reliable batteries with long-lasting warranty and on-site replacement.",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80",
    icon: BatteryIcon,
    href: "/#search",
  },
  {
    id: "car-service",
    title: "Car Service",
    description: "Professional maintenance, oil changes, brake repairs, and diagnostics.",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80",
    icon: ServiceIcon,
    href: "/about",
  },
  {
    id: "motorbike-tyres",
    title: "Motorbike Tyres",
    description: "High-performance tires for sport, cruiser, and adventure motorcycles.",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
    icon: MotorbikeIcon,
    href: "/#search",
  },
];

export default function CmsInfoSection() {
  const [info, setInfo] = useState<CmsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/homepage")
      .then((res) => res.json())
      .then((data) => {
        setInfo(data.cmsInfo ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load CMS info", err);
        setLoading(false);
      });
  }, []);

  const subtitle = info?.description || "PowerTyre is the UAE's premier online store for tyres, alloy wheels, and car batteries. Supported by a fleet of mobile tyre fitting workshops and local centers, we deliver safety, quality, and convenience directly to your driveway.";

  if (loading) {
    return (
      <section className="py-20 lg:py-24 bg-white border-t border-ink/5">
        <div className="mx-auto max-w-[1380px] px-4 animate-pulse">
          {/* Header Skeleton */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="h-10 w-3/4 bg-neutral-200 rounded mx-auto mb-4" />
            <div className="h-4 w-full bg-neutral-100 rounded mb-2" />
            <div className="h-4 w-2/3 bg-neutral-100 rounded mx-auto" />
          </div>

          {/* Cards Skeleton */}
          <div className="flex flex-wrap justify-center gap-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] h-[190px] sm:h-[210px] bg-neutral-100 rounded-2xl shrink-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-24 bg-white border-t border-ink/5">
      <div className="mx-auto max-w-[1380px] px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase leading-[1.1] text-black mb-4">
            YOUR TRUSTED <span className="text-[#ed1c24]">AUTO CARE DESTINATION</span>
          </h2>
          <p className="text-base sm:text-lg text-ink/75 leading-relaxed font-light">
            {subtitle}
          </p>
        </div>

        {/* Services Grid (Flex container to allow 3 on first row, 2 centered on second row) */}
        <div className="flex flex-wrap justify-center gap-6">
          {SERVICES.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className="relative flex w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] h-[190px] sm:h-[210px] bg-neutral-950 rounded-2xl overflow-hidden shadow-card border border-white/5 hover:border-white/10 hover:shadow-cardHover hover:-translate-y-1.5 transition-all duration-300 group shrink-0"
              >
                {/* Left Side: Background Image */}
                <div className="relative w-[38%] h-full overflow-hidden shrink-0">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay gradient to merge/fade image into the content box */}
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-neutral-950 z-10" />
                </div>

                {/* Right Side: Dark Content Box with Glassmorphism Overlap */}
                <div className="relative w-[67%] -ml-[5%] z-20 bg-gradient-to-br from-neutral-900/95 to-neutral-950/100 backdrop-blur-sm p-4 sm:p-6 flex flex-col justify-center text-left rounded-l-2xl border-l border-white/10">
                  {/* Icon Wrapper */}
                  <div className="mb-2.5 sm:mb-3 w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center group-hover:bg-[#ed1c24] group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  {/* Title */}
                  <h3 className="font-sans text-base sm:text-lg font-bold text-white mb-1 sm:mb-1.5 group-hover:text-[#ed1c24] transition-colors duration-300">
                    {card.title}
                  </h3>
                  {/* Description */}
                  <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 leading-relaxed group-hover:text-neutral-300 transition-colors duration-300">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
