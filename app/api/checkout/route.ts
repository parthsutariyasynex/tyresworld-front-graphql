import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth-cookie";
import { CHECKOUT_AGREEMENTS_QUERY } from "@/lib/queries";
import { MISC_MUTATIONS } from "@/lib/mutations";
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

/* GET /api/checkout?store=default — checkout terms & conditions */
export async function GET(req: NextRequest) {
  const store = new URL(req.url).searchParams.get("store") ?? "default";

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(store),
      body:    JSON.stringify({ query: CHECKOUT_AGREEMENTS_QUERY }),
      next:    { revalidate: 3600 },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { agreements: [], error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status },
      );
    }

    return NextResponse.json(
      { agreements: json?.data?.checkoutAgreements ?? [] },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { agreements: [], error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}

/* POST /api/checkout  op: estimateShipping */
export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({} as Record<string, unknown>));
  const op    = body.op as string;
  const token = readAuthToken(req) ?? (body.token as string | undefined);

  try {
    switch (op) {

      case "estimateShipping": {
        const j = await gql(MISC_MUTATIONS.estimateShipping, { input: body.input }, token);
        const methods = j.data?.estimateShippingMethods as unknown[] | undefined;
        return NextResponse.json({ methods: methods ?? [], error: err(j) });
      }

      case "estimateTotals": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(MISC_MUTATIONS.estimateTotals, { cartId: body.cartId, address: body.address }, token);
        const prices = (j.data?.estimateTotals as { cart?: { prices?: unknown } } | undefined)?.cart?.prices;
        return NextResponse.json({ prices: prices ?? null, error: err(j) });
      }

      default:
        return NextResponse.json({ error: `Unknown checkout op: ${op}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout request failed" },
      { status: 502 },
    );
  }
}
