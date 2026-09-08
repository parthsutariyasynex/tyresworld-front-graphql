"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Disc,
  BatteryCharging,
  ShieldCheck,
  Wrench,
  CircleDot,
  Bike,
  Tag,
  MapPin,
  HelpCircle,
  PhoneCall,
  Car,
  Lightbulb,
  Zap,
  Cog,
  Fuel,
  Fan,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { MAIN_NAV, navHref, navLabel } from "@/src/config/navigation";

function getCategoryIcon(id: string, slug: string): LucideIcon {
  const key = `${id} ${slug}`.toLowerCase();
  if (key.includes("tyre") || key.includes("tire")) return Disc;
  if (key.includes("battery")) return BatteryCharging;
  if (key.includes("insurance") || key.includes("shield")) return ShieldCheck;
  if (key.includes("service") || key.includes("repair") || key.includes("mech")) return Wrench;
  if (key.includes("rim") || key.includes("wheel")) return CircleDot;
  if (key.includes("bike") || key.includes("moto")) return Bike;
  if (key.includes("offer") || key.includes("deal") || key.includes("discount")) return Tag;
  if (key.includes("installer") || key.includes("partner") || key.includes("location") || key.includes("map")) return MapPin;
  if (key.includes("faq") || key.includes("help") || key.includes("question")) return HelpCircle;
  if (key.includes("contact") || key.includes("call") || key.includes("phone")) return PhoneCall;
  if (key.includes("light") || key.includes("lamp")) return Lightbulb;
  if (key.includes("brake")) return Disc;
  if (key.includes("engine") || key.includes("trans")) return Cog;
  if (key.includes("fuel") || key.includes("exhaust") || key.includes("gas") || key.includes("oil")) return Fuel;
  if (key.includes("cool") || key.includes("ac") || key.includes("air")) return Fan;
  if (key.includes("elect") || key.includes("sensor")) return Zap;
  if (key.includes("body") || key.includes("exterior")) return Car;
  return Layers;
}

/**
 * "Browse All Categories" rail — the left column of the hero grid.
 */
export default function CategoryRail({ locale }: { locale: string }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="ptr-cat-rail relative z-30" onMouseLeave={() => setHoveredId(null)}>
      <div className="ptr-cat-rail-body">
        {MAIN_NAV.map((item) => {
          const Icon = getCategoryIcon(item.id, item.slug);
          const hasChildren = !!item.children?.length;
          const isHovered = hoveredId === item.id;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredId(item.id)}
            >
              <Link
                href={navHref(item, locale)}
                className={`ptr-cat-row ptr-cat-link ${isHovered ? "bg-[rgb(var(--c-surface-2))]" : ""}`}
              >
                <span className="ptr-cat-icon-wrap" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} className="ptr-cat-icon" />
                </span>
                <span className="ptr-cat-label">{navLabel(item, locale)}</span>
                <ChevronRight
                  size={15}
                  className={`ptr-cat-chevron transition-all ${
                    hasChildren ? "opacity-90" : "opacity-40"
                  } ${isHovered && hasChildren ? "translate-x-0.5 text-[#ed1c24] opacity-100" : ""}`}
                  aria-hidden="true"
                />
              </Link>

              {/* Sub-menu flyout for items with children (Car Services & Tyres) */}
              {hasChildren && isHovered && (
                <div
                  className={`absolute top-0 ${
                    locale === "ar" ? "right-full -mr-1" : "left-full -ml-1"
                  } z-50 min-w-[250px] max-w-[300px] bg-white rounded-xl shadow-2xl border border-gray-200 border-t-2 border-t-[#ed1c24] py-1 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150`}
                >
                  {item.children!.map((child) => {
                    const ChildIcon = getCategoryIcon(child.id, child.slug);
                    return (
                      <Link
                        key={child.id}
                        href={navHref(child, locale)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-[13px] text-gray-700 hover:text-[#ed1c24] hover:bg-gray-50 transition-colors font-medium group"
                      >
                        <ChildIcon size={15} className="text-gray-400 group-hover:text-[#ed1c24] transition-colors" />
                        <span className="truncate">{navLabel(child, locale)}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
