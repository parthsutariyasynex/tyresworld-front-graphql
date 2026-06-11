import { NextResponse } from "next/server";
import { MENU_QUERY, parseMenu, type GqlCategoriesResponse } from "@/lib/magento";

/* ─────────────────────────────────────────────────────────────────
   Navigation menu — built from the Magento category tree via GraphQL.
   Endpoint comes from MAGENTO_GRAPHQL_URL (.env.local).
───────────────────────────────────────────────────────────────── */
const GRAPHQL_URL =
  (process.env.MAGENTO_GRAPHQL_URL ?? "https://www.tyrescart.ae/graphql").replace(/\/$/, "");
const MAGENTO_TOKEN = process.env.MAGENTO_API_TOKEN ?? "";

export async function GET() {
  const headers: HeadersInit = {
    Accept:         "application/json",
    "Content-Type": "application/json",
  };
  if (MAGENTO_TOKEN) headers["Authorization"] = `Bearer ${MAGENTO_TOKEN}`;

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: MENU_QUERY }),
      next: { revalidate: 3600 },   // menu changes rarely — cache 1h
    });

    const raw = (await res.json().catch(() => null)) as GqlCategoriesResponse | null;

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { menu: [], error: raw?.errors?.[0]?.message ?? `Magento GraphQL returned HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    const menu = parseMenu(raw);
    return NextResponse.json(
      { menu },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { menu: [], error: err instanceof Error ? err.message : "Network error reaching Magento GraphQL" },
      { status: 502 }
    );
  }
}
