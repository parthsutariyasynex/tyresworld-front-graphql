/* ─────────────────────────────────────────────────────────────────
   CMS SERVICE
   Fetches Magento CMS pages (content + SEO meta) so any page created
   in Magento Admin renders dynamically.
───────────────────────────────────────────────────────────────── */
import { magentoFetch } from "@/lib/graphql/client";
import { CMS_PAGE_QUERY } from "@/lib/queries";

export interface CmsPage {
  identifier: string;
  title: string;
  content: string;
  content_heading?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export async function getCmsPage(identifier: string, store?: string): Promise<CmsPage | null> {
  const r = await magentoFetch<{ cmsPage?: CmsPage | null }>(
    CMS_PAGE_QUERY,
    { identifier },
    { store, revalidate: 3600 },
  );
  if (!r.ok || !r.data?.cmsPage?.title) return null;
  return r.data.cmsPage;
}
