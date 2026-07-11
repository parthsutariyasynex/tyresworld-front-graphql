import { NextRequest, NextResponse } from "next/server";
import { COMPARE_MUTATIONS } from "@/lib/mutations";
import { COMPARE_LIST_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

type Gql = { data?: Record<string, unknown>; errors?: { message: string }[] };

async function gql(query: string, variables: Record<string, unknown>, token?: string): Promise<Gql> {
  const headers = magentoHeaders() as Record<string, string>;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
    method: "POST", headers, cache: "no-store",
    body: JSON.stringify({ query, variables }),
  });
  return (await res.json().catch(() => ({}))) as Gql;
}

const err = (j: Gql) => j?.errors?.[0]?.message;

/* GET /api/compare?uid=<compareListUid>  — rehydrate compare list on page load */
export async function GET(req: NextRequest) {
  const uid = new URL(req.url).searchParams.get("uid");
  if (!uid) return NextResponse.json({ list: null, error: "uid required" }, { status: 400 });

  try {
    const j = await gql(COMPARE_LIST_QUERY, { uid });
    return NextResponse.json(
      { list: j.data?.compareList ?? null, error: err(j) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ list: null, error: e instanceof Error ? e.message : "Failed" }, { status: 502 });
  }
}

/* POST /api/compare  op: create | add | remove | delete | assign */
export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({} as Record<string, unknown>));
  const op    = body.op as string;
  const token = body.token as string | undefined;

  try {
    switch (op) {

      case "create": {
        const products = body.products as string[] | undefined;
        const j = await gql(COMPARE_MUTATIONS.create, { input: products?.length ? { products } : {} }, token);
        const list = j.data?.createCompareList;
        return NextResponse.json({ list: list ?? null, error: err(j) });
      }

      case "add": {
        const j = await gql(COMPARE_MUTATIONS.add, { uid: body.uid, products: body.products }, token);
        const list = j.data?.addProductsToCompareList;
        return NextResponse.json({ list: list ?? null, error: err(j) });
      }

      case "remove": {
        const j = await gql(COMPARE_MUTATIONS.remove, { uid: body.uid, products: body.products }, token);
        const list = j.data?.removeProductsFromCompareList;
        return NextResponse.json({ list: list ?? null, error: err(j) });
      }

      case "delete": {
        const j = await gql(COMPARE_MUTATIONS.delete, { uid: body.uid }, token);
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      case "assign": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(COMPARE_MUTATIONS.assign, { uid: body.uid }, token);
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      default:
        return NextResponse.json({ error: `Unknown compare op: ${op}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Compare request failed" }, { status: 502 });
  }
}
