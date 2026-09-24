/* ─────────────────────────────────────────────────────────────────
   HOMEPAGE SERVICE
   Real dynamic homepage sections from Magento's Klever module (kleverHomepage).
   Most sections are now admin-authored CMS HTML blocks (KleverHomeSection:
   identifier/title/enabled/html), not structured fields — confirmed via
   live schema introspection. Only hero.banners and offers.banners remain
   structured banner-carousel data.
   - Hero banner (headings + images)
   - Exclusive offers (heading CMS block + promo banners)
   - How it works / Services / Top reasons / About / Brands / Blog /
     Testimonials: each a KleverHomeSection { identifier, title, enabled, html }
───────────────────────────────────────────────────────────────── */
import { magentoFetch } from "@/lib/graphql/client";
import { KLEVER_HOMEPAGE_QUERY } from "@/lib/queries";

export interface KleverHomeHeroBanner {
  title?: string | null;
  image?: string | null;
  mobile_image?: string | null;
  url?: string | null;
  new_tab?: boolean | null;
}

export interface KleverHomeHero {
  heading_line1?: string | null;
  heading_line2?: string | null;
  banners?: KleverHomeHeroBanner[] | null;
}

export interface KleverHomeBanner {
  title?: string | null;
  image?: string | null;
  mobile_image?: string | null;
  url?: string | null;
}

/** Generic admin-authored CMS block — the shape of every homepage section
    besides hero and offers.banners. */
export interface KleverHomeSection {
  identifier?: string | null;
  title?: string | null;
  enabled?: boolean | null;
  html?: string | null;
}

export interface KleverHomeOffers {
  heading?: KleverHomeSection | null;
  banners?: KleverHomeBanner[] | null;
}

export interface KleverHomepageData {
  hero?: KleverHomeHero | null;
  offers?: KleverHomeOffers | null;
  how_it_works?: KleverHomeSection | null;
  services?: KleverHomeSection | null;
  top_reasons?: KleverHomeSection | null;
  brands?: KleverHomeSection | null;
  about?: KleverHomeSection | null;
  blog?: KleverHomeSection | null;
  testimonials?: KleverHomeSection | null;
}

interface HomepageResponse {
  kleverHomepage?: KleverHomepageData | null;
}

/** When a Magento CMS/widget block fails to render server-side, its `html`
    field comes back as this literal PHP error string instead of real
    markup (seen live on `brands`/`blog`) — same check already used for the
    CMS catch-all page. Callers should treat a match as "no content", not
    render it. */
export function isBrokenCmsHtml(html: string | null | undefined): boolean {
  return !!html && /Error filtering template:/i.test(html);
}

export async function getHomepageData(store?: string): Promise<KleverHomepageData | null> {
  try {
    const res = await magentoFetch<HomepageResponse>(
      KLEVER_HOMEPAGE_QUERY,
      {},
      {
        store,
        revalidate: 300, // 5 minutes cache
      },
    );

    if (res.errors?.length) {
      console.warn("kleverHomepage GraphQL errors:", res.errors);
      return null;
    }

    return res.data?.kleverHomepage ?? null;
  } catch (err) {
    console.error("Failed to fetch kleverHomepage:", err);
    return null;
  }
}
