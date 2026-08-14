import { NextRequest, NextResponse } from "next/server";
import { VIEW_MORE_FILTER_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

export const dynamic = "force-dynamic";

type GqlResult = {
  data?: {
    viewMoreFilter?: {
      aggregations?: {
        attribute_code: string;
        label: string;
        count: number;
        has_more: boolean;
        options: { label: string; value: string; count: number }[];
      }[];
    };
  } | null;
  errors?: { message: string }[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filterName   = searchParams.get("filterName")  ?? "";
  const search       = searchParams.get("search")      ?? "";
  const urlKey       = searchParams.get("urlKey")      ?? "";
  const categoryUid  = searchParams.get("categoryUid") ?? "";
  const store        = searchParams.get("store")       ?? "default";

  if (!filterName) {
    return NextResponse.json({ options: [], error: "filterName is required" }, { status: 400 });
  }

  try {
    // category_uid takes precedence over category_url_path when both are supplied.
    const filter = categoryUid
      ? { category_uid: { eq: categoryUid } }
      : urlKey
      ? { category_url_path: { eq: urlKey } }
      : undefined;

    const headers = magentoHeaders(store) as Record<string, string>;
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: VIEW_MORE_FILTER_QUERY,
        variables: { filterName, search, filter },
      }),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => ({}))) as GqlResult;

    if (!res.ok && !json?.data) {
      return NextResponse.json({ options: [], error: "Magento request failed" }, { status: 502 });
    }

    if (json?.data === null) {
      const msg = json?.errors?.[0]?.message ?? "viewMoreFilter returned null data";
      console.error("[view-more-filter]", msg);
      return NextResponse.json({ options: [], error: msg });
    }

    if (json?.errors?.length) {
      console.warn("[view-more-filter] GraphQL warnings:", json.errors.map(e => e.message));
    }

    const aggregations = json?.data?.viewMoreFilter?.aggregations ?? [];
    const agg = aggregations[0];
    const options = (agg?.options ?? []).map(o => ({
      label: o.label,
      value: String(o.value),
      count: Number(o.count ?? 0),
    }));

    return NextResponse.json({ options, hasMore: agg?.has_more ?? false });

  } catch (e) {
    return NextResponse.json(
      { options: [], error: e instanceof Error ? e.message : "Failed to fetch filter options" },
      { status: 502 },
    );
  }
}
