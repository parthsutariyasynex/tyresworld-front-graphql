import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last (current-page) crumb. */
  href?: string;
  /** For a crumb that navigates via app state instead of a URL (e.g. "back to model"). */
  onClick?: () => void;
}

interface PageHeroBannerProps {
  /** Page H1. */
  title: string;
  /** Supporting line under the title. */
  description?: string;
  breadcrumb: BreadcrumbItem[];
  /** Show a loading skeleton instead of the title/description. */
  loading?: boolean;
  /** Show the small TyresWorld wheel mark after the title. Default true. */
  showLogo?: boolean;
  /** Show the "Contact Support" WhatsApp CTA. Default true. */
  showCta?: boolean;
}

/**
 * Site-wide inner-page hero: the dark-to-red gradient card with title,
 * description, a WhatsApp "Contact Support" CTA, and a breadcrumb — the
 * same design used on the tyre listing/brand pages (CategoryPageInner),
 * now the single shared banner for every inner page.
 */
export default function PageHeroBanner({
  title,
  description,
  breadcrumb,
  loading = false,
}: PageHeroBannerProps) {
  return (
    <div className="bg-gray-50 pt-2 pb-0.5">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#780a0f] via-[#b31219] to-[#ed1c24] p-3.5 sm:p-4 md:p-5 shadow-md border border-red-900/15">
          {/* Background ambient lighting */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-black/25 blur-3xl pointer-events-none" />

          {/* ── Main Banner Content (Centered) ── */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
            <div className="max-w-5xl mx-auto text-center flex flex-col items-center justify-center w-full">
              {loading ? (
                <div className="space-y-2 w-full flex flex-col items-center justify-center text-center">
                  <div className="h-7 sm:h-8 bg-white/20 rounded-lg w-3/4 max-w-md animate-pulse mx-auto" />
                  <div className="h-3.5 bg-white/10 rounded w-1/2 max-w-xs animate-pulse mx-auto" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center text-center w-full">
                    <h1
                      id="page-title-heading"
                      className="text-lg sm:text-2xl md:text-[26px] font-black text-white tracking-tight leading-tight drop-shadow-sm text-center mx-auto"
                    >
                      <span className="base relative z-10" data-ui-id="page-title-wrapper">
                        {title}
                      </span>
                    </h1>
                  </div>

                  {description && (
                    <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs md:text-[13px] text-white/95 leading-relaxed font-normal max-w-4xl mx-auto text-center">
                      {description}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Breadcrumb Inside Banner (Centered Connected Ribbon Style) ── */}
            {breadcrumb && breadcrumb.length > 0 && (
              <div className="relative z-10 flex justify-center w-full mt-3 sm:mt-4">
                <nav className="inline-flex items-center gap-1 p-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full shadow-lg max-w-full overflow-x-auto custom-scrollbar">
                  {breadcrumb.map((crumb, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === breadcrumb.length - 1;
                    return (
                      <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1 shrink-0">
                        {idx > 0 && <ChevronRight size={11} className="shrink-0 text-white/40 -mx-0.5" />}
                        {isLast ? (
                          <span className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 bg-white text-gray-950 font-black text-xs uppercase tracking-wide rounded-full shadow-md border border-white shrink-0">
                            <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            </span>
                            <span>{crumb.label}</span>
                          </span>
                        ) : crumb.onClick ? (
                          <button
                            type="button"
                            onClick={crumb.onClick}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white/85 hover:text-white hover:bg-white/15 transition-all text-xs font-semibold cursor-pointer shrink-0 group"
                          >
                            {isFirst && (
                              <span className="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:bg-white group-hover:text-red-600 transition-colors">
                                <Home size={10} />
                              </span>
                            )}
                            <span>{crumb.label}</span>
                          </button>
                        ) : crumb.href ? (
                          <Link
                            href={crumb.href}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white/85 hover:text-white hover:bg-white/15 transition-all text-xs font-semibold shrink-0 group"
                          >
                            {isFirst && (
                              <span className="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:bg-white group-hover:text-red-600 transition-colors">
                                <Home size={10} />
                              </span>
                            )}
                            <span>{crumb.label}</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white/85 text-xs font-semibold shrink-0">
                            {isFirst && (
                              <span className="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center text-white">
                                <Home size={10} />
                              </span>
                            )}
                            <span>{crumb.label}</span>
                          </span>
                        )}
                      </span>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
