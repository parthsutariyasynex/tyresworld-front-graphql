import Breadcrumbs, { type BreadcrumbExtraItem } from "@/components/Breadcrumbs";

export type { BreadcrumbExtraItem };

interface PageHeroBannerProps {
  /** Page H1. Also used as this page's breadcrumb label, unless breadcrumbLabel is set. */
  title: string;
  /** Supporting line under the title. */
  description?: string;
  /** Overrides `title` as this page's own breadcrumb label. */
  breadcrumbLabel?: string;
  /** This page's real ancestor crumb(s) (e.g. "Tyres" on a brand page) — never derived from browsing history. */
  breadcrumbParents?: BreadcrumbExtraItem[];
  /** In-page wizard sub-steps (e.g. make → model → year) appended after the current page's crumb. */
  breadcrumbExtra?: BreadcrumbExtraItem[];
  /** When breadcrumbExtra is set, lets the current page's own crumb trigger in-page state instead of linking to its URL. */
  onBreadcrumbCurrentClick?: () => void;
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
  breadcrumbLabel,
  breadcrumbParents,
  breadcrumbExtra,
  onBreadcrumbCurrentClick,
  loading = false,
}: PageHeroBannerProps) {
  return (
    <div className="bg-gray-50 pt-2 pb-0.5">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#780a0f] via-[#b31219] to-[#ed1c24] px-3.5 py-4 sm:p-5 md:p-6 shadow-md border border-red-900/15">
          {/* Background ambient lighting */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-black/25 blur-3xl pointer-events-none" />

          {/* ── Main Banner Content (Centered) ── */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center w-full">
              {loading ? (
                <div className="space-y-2 w-full flex flex-col items-center justify-center text-center">
                  <div className="h-6 sm:h-8 bg-white/20 rounded-lg w-3/4 max-w-md animate-pulse mx-auto" />
                  <div className="h-3.5 bg-white/10 rounded w-1/2 max-w-xs animate-pulse mx-auto" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center text-center w-full px-1">
                    <h1
                      id="page-title-heading"
                      className="text-base sm:text-xl md:text-2xl lg:text-[26px] font-black text-white tracking-tight leading-snug sm:leading-tight drop-shadow-sm text-center mx-auto"
                    >
                      <span className="base relative z-10" data-ui-id="page-title-wrapper">
                        {title}
                      </span>
                    </h1>
                  </div>

                  {description && (
                    <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs md:text-[13px] text-white/95 leading-relaxed font-normal max-w-3xl mx-auto text-center px-2">
                      {description}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Breadcrumb Inside Banner (Centered Connected Ribbon Style) ── */}
            {!loading && (breadcrumbLabel || title) && (
              <div className="relative z-10 flex justify-center w-full mt-2.5 sm:mt-3.5 max-w-full px-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Breadcrumbs
                  label={breadcrumbLabel || title}
                  parents={breadcrumbParents}
                  extra={breadcrumbExtra}
                  onCurrentClick={onBreadcrumbCurrentClick}
                  variant="banner"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
