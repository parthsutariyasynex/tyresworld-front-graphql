"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { decodeBlogHtml } from "@/lib/services/blog.service";
import PageHeroBanner from "@/components/PageHeroBanner";

interface FaqItem {
  faq_id: number;
  question: string;
  answer: string;
  sort_order?: number | null;
}

interface FaqGroup {
  group_id: number;
  name: string;
  icon?: string | null;
  sort_order?: number | null;
  faqs: FaqItem[];
}

export default function FaqPage() {
  const pathname = usePathname();
  const locale = "en";

  const [groups, setGroups] = useState<FaqGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  /* Real FAQ groups/questions from Magento's kleverFaq (Klever module) —
     English-only at the source, so both locales render this same real
     content (no fabricated Arabic translation). */
  useEffect(() => {
    let active = true;
    fetch(`/api/faq?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const raw: FaqGroup[] = data?.groups ?? [];
        setGroups(
          [...raw]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((g) => ({
              ...g,
              faqs: [...(g.faqs ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
            })),
        );
      })
      .catch(() => { /* falls back to the empty state below */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToGroup = (groupId: number) => {
    const el = document.getElementById(`faq-group-${groupId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-white min-h-screen" dir="ltr">
      <PageHeroBanner
        title="Frequently Asked Questions"
        breadcrumbLabel="FAQ"
        description="Find clear answers to common questions about buying tyres, booking mobile fitting, warranty, and our services across the UAE."
      />

      {/* ── Main Content ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10 sm:py-14">
        {loading ? (
          <>
            {/* ── Category Navigation Cards Skeleton ── */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-32 sm:w-36 h-32 sm:h-36 bg-gray-100 border border-gray-200/90 rounded-2xl animate-pulse"
                />
              ))}
            </div>

            {/* ── FAQ List Skeleton ── */}
            <div className="space-y-12 sm:space-y-14">
              {Array.from({ length: 2 }).map((_, groupIdx) => (
                <div key={groupIdx}>
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4 sm:mb-5" />
                  <div className="space-y-2.5">
                    {Array.from({ length: 4 }).map((_, itemIdx) => (
                      <div key={itemIdx} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">FAQs are unavailable right now.</div>
        ) : (
          <>
            {/* ── Category Navigation Cards ── */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
              {groups.map((group) => (
                <button
                  key={group.group_id}
                  onClick={() => scrollToGroup(group.group_id)}
                  className="flex flex-col items-center justify-center w-32 sm:w-36 h-32 sm:h-36 bg-white border border-gray-200/90 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-[#ed1c24]/50 transition-all duration-200 group cursor-pointer"
                >
                  <div className="w-16 h-16 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    {group.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={group.icon} alt="" className="max-w-14 max-h-14 object-contain" />
                    ) : null}
                  </div>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-tight text-gray-950 mt-2 group-hover:text-[#ed1c24] transition-colors text-center font-sans">
                    {group.name}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Categorized FAQ Sections ── */}
            <div className="space-y-12 sm:space-y-14">
              {groups.map((group) => (
                <div key={group.group_id} id={`faq-group-${group.group_id}`} className="scroll-mt-24">
                  <h2 className="text-lg sm:text-xl font-black uppercase text-gray-950 tracking-tight mb-4 sm:mb-5 font-sans">
                    {group.name}
                  </h2>

                  <div className="space-y-2.5">
                    {group.faqs.map((item) => {
                      const isOpen = !!openItems[item.faq_id];
                      return (
                        <div
                          key={item.faq_id}
                          className="rounded-lg bg-[#e8e8e8] border-l-4 border-l-[#ed1c24] rtl:border-l-0 rtl:border-r-4 rtl:border-r-[#ed1c24] overflow-hidden transition-all duration-200"
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item.faq_id)}
                            className="w-full flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 text-left rtl:text-right font-sans font-bold text-[13px] sm:text-[14px] text-gray-950 hover:text-[#ed1c24] transition-colors cursor-pointer outline-none select-none"
                          >
                            <span className="pr-4 rtl:pr-0 rtl:pl-4 uppercase tracking-tight leading-snug">
                              {item.question}
                            </span>
                            <ChevronRight
                              size={18}
                              className={`text-gray-700 shrink-0 transition-transform duration-300 ${
                                isOpen ? "rotate-90 rtl:-rotate-90" : "rtl:rotate-180"
                              }`}
                            />
                          </button>

                          <div
                            className={`transition-all duration-300 ease-in-out ${
                              isOpen
                                ? "max-h-[1000px] opacity-100 bg-white border-t border-gray-200/80 px-5 sm:px-6 py-4"
                                : "max-h-0 opacity-0 overflow-hidden"
                            }`}
                          >
                            <div
                              className="text-xs sm:text-[13.5px] text-gray-700 leading-relaxed font-normal [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold"
                              dangerouslySetInnerHTML={{ __html: decodeBlogHtml(item.answer, locale) }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
