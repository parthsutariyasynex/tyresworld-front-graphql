"use client";

import { useEffect, useState } from "react";
import type { KleverHomeSection } from "@/lib/services/homepage.service";
import { isBrokenCmsHtml } from "@/lib/services/homepage.service";

interface HowItWorksProps {
  locale?: string;
  initialHowItWorks?: KleverHomeSection | null;
}

/* how_it_works is now an admin-authored CMS HTML block (identifier/title/
   enabled/html), not a structured steps array — confirmed via live schema
   introspection. Rendered through the same .cms-content styling used for
   every other Magento-authored HTML block on the site. */
export default function HowItWorks({ locale = "en", initialHowItWorks }: HowItWorksProps) {
  const [data, setData] = useState<KleverHomeSection | null>(() => initialHowItWorks ?? null);

  useEffect(() => {
    if (initialHowItWorks) return;
    let active = true;
    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((d) => { if (active) setData(d?.howItWorks ?? null); })
      .catch(() => { /* section stays hidden if the fetch fails */ });
    return () => { active = false; };
  }, [locale, initialHowItWorks]);

  if (!data?.enabled || !data.html || isBrokenCmsHtml(data.html)) return null;

  return (
    <section className="section section-padding how-works bg-black py-16 lg:py-20">
      <div className="container custom-width max-w-7xl mx-auto px-4">
        <div className="cms-content cms-content-dark" dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
    </section>
  );
}
