"use client";

import { useEffect, useState } from "react";
import type { KleverHomeSection } from "@/lib/services/homepage.service";
import { isBrokenCmsHtml } from "@/lib/services/homepage.service";

interface AutoCareServicesProps {
  locale?: string;
  initialServices?: KleverHomeSection | null;
}

/* services is now an admin-authored CMS HTML block (identifier/title/
   enabled/html), not a structured tiles array — confirmed via live schema
   introspection, so the previous card design (badges/round photos/CTA
   labels) had no real field to source from and always fell back to local
   fixed presentation data. Rendered through the shared .cms-content
   styling instead, same as every other Magento-authored HTML block. */
export default function AutoCareServices({ locale = "en", initialServices }: AutoCareServicesProps) {
  const [data, setData] = useState<KleverHomeSection | null>(() => initialServices ?? null);

  useEffect(() => {
    if (initialServices) return;
    let active = true;
    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((d) => { if (active) setData(d?.services ?? null); })
      .catch(() => { /* section stays hidden if the fetch fails */ });
    return () => { active = false; };
  }, [locale, initialServices]);

  if (!data?.enabled || !data.html || isBrokenCmsHtml(data.html)) return null;

  // Magento's GraphQL block renderer resolves these image URLs against the
  // wrong design/theme context (a generic "graphql/_view" static path that
  // 404s) — the real live site's own PHP frontend renders the exact same
  // block using the real theme's static path instead, confirmed via
  // DevTools on the live page and verified directly (each of the 6
  // rewritten URLs returns 200 with a distinct real photo, not a
  // placeholder). Same fix pattern as KNOWN_CMS_MEDIA_MAP in
  // app/[locale]/[...slug]/page.tsx: correcting a known-broken URL to the
  // real asset, not fabricating one.
  const html = data.html.replace(
    /https:\/\/www1\.tyresworld\.ae\/static\/version(\d+)\/graphql\/_view\/en_US\/images\/([a-z0-9-]+\.png)/gi,
    "https://www1.tyresworld.ae/static/version$1/frontend/Klever/automotive/en_US/images/$2",
  );

  return (
    <section className="ptr-section bg-[#fbfbfb] py-12 lg:py-16 border-t border-b border-gray-100/80">
      <div className="ptr-container">
        <div className="cms-content" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}
