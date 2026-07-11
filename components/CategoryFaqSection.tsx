"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  faqs: FaqItem[];
  loading?: boolean;
  dir?: "ltr" | "rtl";
}

function FaqSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 w-4 bg-gray-200 rounded shrink-0 ml-4" />
        </div>
      ))}
    </div>
  );
}

export default function CategoryFaqSection({ faqs, loading, dir = "ltr" }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <section className="bg-white py-16 border-t border-gray-100" dir={dir}>
        <div className="container max-w-5xl">
          <div className="h-7 w-24 bg-gray-200 rounded mx-auto mb-10 animate-pulse" />
          <FaqSkeleton />
        </div>
      </section>
    );
  }

  if (!faqs.length) return null;

  return (
    <section className="bg-white py-16 border-t border-gray-100" dir={dir}>
      <div className="container max-w-5xl">
        <h2 className="text-xl font-black uppercase tracking-widest text-center mb-10">
          FAQ&acute;S
        </h2>

        <div className="divide-y divide-gray-200">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-start gap-4 outline-none group"
                >
                  <span className="text-[14px] font-semibold text-gray-900 leading-snug group-hover:text-[#ed1c24] transition-colors">
                    {faq.question}
                  </span>
                  <span className="shrink-0 text-gray-500 group-hover:text-[#ed1c24] transition-colors">
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-5 -mt-1" : "grid-rows-[0fr] opacity-0 pb-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
