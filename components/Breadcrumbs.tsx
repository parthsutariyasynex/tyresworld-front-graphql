"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useNavigationTrail } from "@/lib/navigationTrail";

export interface BreadcrumbExtraItem {
  label: string;
  href?: string;
  /** For a crumb that navigates via in-page state instead of a URL (e.g. a wizard "back to model" step). */
  onClick?: () => void;
}

interface BreadcrumbsProps {
  /** Current page's display label — normally the same text as the page's H1/title. */
  label: string;
  /** In-page wizard sub-steps (e.g. make → model → year) appended after the current page. */
  extra?: BreadcrumbExtraItem[];
  /**
   * When `extra` is non-empty, the current page's own crumb is no longer the
   * last one — normally it becomes a plain link back to this page's URL. If
   * that "back" step is actually in-page state (not a real navigation, e.g. a
   * make → model wizard on one URL), pass a handler here instead of a link.
   */
  onCurrentClick?: () => void;
  /** "banner" = dark frosted ribbon inside the red hero card; "bar" = standalone light gray bar. */
  variant?: "banner" | "bar";
}

interface RenderCrumb {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  isHome: boolean;
  isCurrent: boolean;
}

/**
 * Site-wide breadcrumb driven by the visitor's actual navigation history for
 * this tab (tracked by NavigationTrailProvider), not a hardcoded per-page
 * hierarchy — so it reflects wherever they actually came from.
 */
export default function Breadcrumbs({
  label,
  extra = [],
  onCurrentClick,
  variant = "banner",
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const { trail, visit } = useNavigationTrail();

  useEffect(() => {
    if (!pathname || !label) return;
    visit(pathname, label);
  }, [pathname, label, visit]);

  const hasExtra = extra.length > 0;

  const crumbs: RenderCrumb[] = useMemo(() => {
    const pageCrumbs: RenderCrumb[] = trail.map((entry, idx) => {
      const isLastPageCrumb = idx === trail.length - 1;
      const isCurrent = isLastPageCrumb && !hasExtra;
      const backHandler = isLastPageCrumb && hasExtra ? onCurrentClick : undefined;
      return {
        key: entry.path,
        label: entry.label,
        href: isCurrent || backHandler ? undefined : entry.path,
        onClick: backHandler,
        isHome: false,
        isCurrent,
      };
    });
    const extraCrumbs: RenderCrumb[] = extra.map((e, idx) => ({
      key: `extra-${idx}-${e.label}`,
      label: e.label,
      href: e.href,
      onClick: e.onClick,
      isHome: false,
      isCurrent: idx === extra.length - 1,
    }));
    return [
      { key: "home", label: "Home", href: "/", isHome: true, isCurrent: false },
      ...pageCrumbs,
      ...extraCrumbs,
    ];
  }, [trail, extra, hasExtra, onCurrentClick]);

  const isDark = variant === "banner";

  return (
    <nav
      aria-label="Breadcrumb"
      className={
        isDark
          ? "inline-flex items-center gap-1 p-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full shadow-lg max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "inline-flex items-center gap-1 p-1 bg-gray-100/90 border border-gray-200/80 rounded-full shadow-2xs text-xs font-medium max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
    >
      {crumbs.map((crumb, idx) => (
        <span key={crumb.key} className="inline-flex items-center gap-1 shrink-0 min-w-0">
          {idx > 0 && (
            <ChevronRight
              size={11}
              className={`shrink-0 -mx-0.5 ${isDark ? "text-white/40" : "text-gray-400"}`}
            />
          )}
          {crumb.isHome ? (
            <Link
              href="/"
              aria-label="Home"
              className={
                isDark
                  ? "inline-flex items-center justify-center w-6 h-6 rounded-full text-white/85 hover:text-white hover:bg-white/15 transition-all shrink-0"
                  : "inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-600 hover:text-gray-950 hover:bg-white transition-all shrink-0"
              }
            >
              <Home size={12} />
            </Link>
          ) : crumb.isCurrent ? (
            <span
              className={
                isDark
                  ? "inline-flex items-center gap-1.5 pl-1.5 pr-2.5 sm:pr-3 py-0.5 sm:py-1 bg-white text-gray-950 font-black text-[10.5px] sm:text-xs uppercase tracking-wide rounded-full shadow-md border border-white shrink-0 min-w-0"
                  : "inline-flex items-center gap-1.5 pl-1.5 pr-2.5 sm:pr-3 py-0.5 sm:py-1 bg-white text-gray-900 font-bold text-[10.5px] sm:text-xs uppercase tracking-wide rounded-full border border-gray-200 shadow-2xs shrink-0 min-w-0"
              }
            >
              {isDark ? (
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24] shrink-0" />
              )}
              <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[280px] md:max-w-[450px]">
                {crumb.label}
              </span>
            </span>
          ) : crumb.onClick ? (
            <button
              type="button"
              onClick={crumb.onClick}
              className={
                isDark
                  ? "inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-white/85 hover:text-white hover:bg-white/15 transition-all text-[10.5px] sm:text-xs font-semibold shrink-0 cursor-pointer max-w-[75px] xs:max-w-[110px] sm:max-w-[180px]"
                  : "inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-gray-600 hover:text-gray-950 hover:bg-white transition-all text-[10.5px] sm:text-xs font-semibold shrink-0 cursor-pointer max-w-[75px] xs:max-w-[110px] sm:max-w-[180px]"
              }
            >
              <span className="truncate">{crumb.label}</span>
            </button>
          ) : crumb.href ? (
            <Link
              href={crumb.href}
              className={
                isDark
                  ? "inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-white/85 hover:text-white hover:bg-white/15 transition-all text-[10.5px] sm:text-xs font-semibold shrink-0 max-w-[75px] xs:max-w-[110px] sm:max-w-[180px]"
                  : "inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-gray-600 hover:text-gray-950 hover:bg-white transition-all text-[10.5px] sm:text-xs font-semibold shrink-0 max-w-[75px] xs:max-w-[110px] sm:max-w-[180px]"
              }
            >
              <span className="truncate">{crumb.label}</span>
            </Link>
          ) : (
            <span
              className={
                isDark
                  ? "inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-white/85 text-[10.5px] sm:text-xs font-semibold shrink-0 max-w-[75px] xs:max-w-[110px] sm:max-w-[180px]"
                  : "inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-gray-600 text-[10.5px] sm:text-xs font-semibold shrink-0 max-w-[75px] xs:max-w-[110px] sm:max-w-[180px]"
              }
            >
              <span className="truncate">{crumb.label}</span>
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
