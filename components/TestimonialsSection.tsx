"use client";

import type { KleverHomeSection } from "@/lib/services/homepage.service";
import { isBrokenCmsHtml } from "@/lib/services/homepage.service";

interface TestimonialsSectionProps {
  testimonials?: KleverHomeSection | null;
}

/* testimonials is now an admin-authored CMS HTML block (identifier/title/
   enabled/html), not just a title string — confirmed via live schema
   introspection. Rendered through the shared .cms-content styling, gated
   by `enabled` exactly as before. */
export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (!testimonials?.enabled || !testimonials.html || isBrokenCmsHtml(testimonials.html)) return null;

  return (
    <section className="ptr-section bg-zinc-950 py-14 lg:py-18 text-white border-t border-zinc-800">
      <div className="ptr-container text-center">
        <div
          className="cms-content cms-content-dark"
          dangerouslySetInnerHTML={{ __html: testimonials.html }}
        />
      </div>
    </section>
  );
}
