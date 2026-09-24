"use client";

import { useEffect, useState } from "react";
import type { KleverHomeSection } from "@/lib/services/homepage.service";
import { isBrokenCmsHtml } from "@/lib/services/homepage.service";

interface WhyChooseUsProps {
  locale?: string;
  initialReasons?: KleverHomeSection | null;
}

/* top_reasons is now an admin-authored CMS HTML block (identifier/title/
   enabled/html), not a structured items array — confirmed via live schema
   introspection. The previous two-column layout's descriptions were never
   real API data either (only `items` titles ever came from Magento; the
   descriptive text was always local placeholder copy), so this renders the
   real CMS HTML instead, through the shared .cms-content styling. */
export default function WhyChooseUs({ locale = "en", initialReasons }: WhyChooseUsProps) {
  const [data, setData] = useState<KleverHomeSection | null>(() => initialReasons ?? null);

  useEffect(() => {
    if (initialReasons) return;
    let active = true;
    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((d) => { if (active) setData(d?.topReasons ?? null); })
      .catch(() => { /* section stays hidden if the fetch fails */ });
    return () => { active = false; };
  }, [locale, initialReasons]);

  if (!data?.enabled || !data.html || isBrokenCmsHtml(data.html)) return null;

  return (
    <section className="section section-padding why-you-should bg-black py-16 lg:py-20 border-t border-white/10">
      <div className="container custom-width max-w-7xl mx-auto px-4">
        <div className="cms-content cms-content-dark" dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
    </section>
  );
}
