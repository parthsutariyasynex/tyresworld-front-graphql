"use client";

import { useEffect, useState } from "react";
import type { KleverHomeSection } from "@/lib/services/homepage.service";
import { isBrokenCmsHtml } from "@/lib/services/homepage.service";

interface AboutUsProps {
  locale?: string;
  initialAbout?: KleverHomeSection | null;
}

/* about is now an admin-authored CMS HTML block (identifier/title/enabled/
   html), not a structured paragraphs array — confirmed via live schema
   introspection. Rendered through the shared .cms-content styling instead
   of the previous "Label: text" paragraph-splitting heuristic. */
export default function AboutUs({ locale = "en", initialAbout }: AboutUsProps) {
  const [data, setData] = useState<KleverHomeSection | null>(() => initialAbout ?? null);

  useEffect(() => {
    if (initialAbout) return;
    let active = true;
    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((d) => { if (active) setData(d?.about ?? null); })
      .catch(() => { /* section stays hidden if the fetch fails */ });
    return () => { active = false; };
  }, [locale, initialAbout]);

  if (!data?.enabled || !data.html || isBrokenCmsHtml(data.html)) return null;

  return (
    <section className="section section-padding site-details bg-[#f8f9fa] py-14 lg:py-16 border-t border-b border-gray-200/70">
      <div className="container custom-width max-w-5xl mx-auto px-4 sm:px-6">
        <div className="cms-content" dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
    </section>
  );
}
