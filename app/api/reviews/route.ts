import { NextRequest, NextResponse } from "next/server";
import { PRODUCT_REVIEW_RATINGS_METADATA_QUERY } from "@/lib/queries";
import { REVIEW_MUTATIONS } from "@/lib/mutations";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

type Gql = { data?: Record<string, unknown>; errors?: { message: string }[] };

async function gql(
  query: string,
  variables: Record<string, unknown>,
  token?: string,
): Promise<Gql> {
  const headers = magentoHeaders() as Record<string, string>;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
    method: "POST",
    headers,
    body:   JSON.stringify({ query, variables }),
    cache:  "no-store",
  });
  return (await res.json().catch(() => ({}))) as Gql;
}

const err = (j: Gql) => j?.errors?.[0]?.message;

/* GET /api/reviews — rating scale metadata for the review form */
export async function GET() {
  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(),
      body:    JSON.stringify({ query: PRODUCT_REVIEW_RATINGS_METADATA_QUERY }),
      next:    { revalidate: 3600 },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { ratings: [], error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status },
      );
    }

    return NextResponse.json(
      { ratings: json?.data?.productReviewRatingsMetadata?.items ?? [] },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { ratings: [], error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}

/* POST /api/reviews  op: create */
export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({} as Record<string, unknown>));
  const op    = body.op as string;
  const token = body.token as string | undefined;

  try {
    switch (op) {

      case "create": {
        const j = await gql(REVIEW_MUTATIONS.create, { input: body.input }, token);
        const r = j.data?.createProductReview as { review?: unknown } | undefined;
        return NextResponse.json({ review: r?.review ?? null, error: err(j) });
      }

      default:
        return NextResponse.json({ error: `Unknown reviews op: ${op}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reviews request failed" },
      { status: 502 },
    );
  }
}
