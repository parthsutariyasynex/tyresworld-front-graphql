import { NextResponse } from "next/server";
import { SOCIAL_URLS_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

export const dynamic = "force-dynamic";

export type SocialLink = { social_type: string; url: string };

type GqlResult = {
  data?: { mpSocialUrls?: { items?: SocialLink[] } | null } | null;
  errors?: { message: string; extensions?: { debugMessage?: string } }[];
};

export async function GET() {
  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders() as Record<string, string>,
      body:    JSON.stringify({ query: SOCIAL_URLS_QUERY }),
      cache:   "no-store",
    });

    const json = (await res.json().catch(() => ({}))) as GqlResult;

    // Mageplaza resolver has a storeId bug — returns internal server error.
    // Return empty list so the footer falls back to hardcoded links.
    if (json.errors?.length || json.data?.mpSocialUrls == null) {
      console.warn("[api/social] mpSocialUrls unavailable:", json.errors?.[0]?.extensions?.debugMessage ?? json.errors?.[0]?.message);
      return NextResponse.json({ links: [] });
    }

    const links: SocialLink[] = (json.data.mpSocialUrls.items ?? []).filter(
      (i): i is SocialLink => !!i.social_type && !!i.url,
    );

    return NextResponse.json({ links });
  } catch (e) {
    console.error("[api/social]", e);
    return NextResponse.json({ links: [] });
  }
}
