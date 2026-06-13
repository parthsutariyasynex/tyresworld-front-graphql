import { NextRequest, NextResponse } from "next/server";
import { AUTH_QUERIES as Q } from "@/lib/auth-queries";

/* Server-side proxy for Magento customer auth + account data. */
const GRAPHQL_URL =
  (process.env.MAGENTO_GRAPHQL_URL ?? "https://www.tyrescart.ae/graphql").replace(/\/$/, "");

type Gql = { data?: Record<string, any>; errors?: { message: string }[] };

async function gql(query: string, variables: Record<string, unknown>, token?: string): Promise<Gql> {
  const headers: HeadersInit = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return (await res.json().catch(() => ({}))) as Gql;
}

const err = (j: Gql) => j?.errors?.[0]?.message;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, any>));
  const op = body.op as string;
  const token = body.token as string | undefined;

  try {
    switch (op) {
      case "register": {
        const j = await gql(Q.register, {
          firstname: body.firstname, lastname: body.lastname,
          email: body.email, password: body.password,
        });
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }
      case "login": {
        const j = await gql(Q.login, { email: body.email, password: body.password });
        const t = (j.data?.generateCustomerToken as { token?: string })?.token;
        return NextResponse.json({ token: t ?? null, error: err(j) });
      }
      case "customer": {
        if (!token) return NextResponse.json({ customer: null, error: "Not authenticated" }, { status: 401 });
        const j = await gql(Q.customer, {}, token);
        return NextResponse.json({ customer: j.data?.customer ?? null, error: err(j) });
      }
      case "logout": {
        if (token) await gql(Q.logout, {}, token);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: `Unknown account op: ${op}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Account request failed" },
      { status: 502 }
    );
  }
}
