import { NextRequest, NextResponse } from "next/server";
import { MISC_MUTATIONS } from "@/lib/mutations";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

/* POST /api/contact
 * body: { name, email, telephone?, comment } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const { name, email, telephone, comment } = body as {
    name?:      string;
    email?:     string;
    telephone?: string;
    comment?:   string;
  };

  if (!name || !email || !comment) {
    return NextResponse.json(
      { ok: false, error: "name, email and comment are required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(),
      body:    JSON.stringify({
        query:     MISC_MUTATIONS.contactUs,
        variables: { input: { name, email, telephone: telephone ?? "", comment } },
      }),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { ok: false, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status },
      );
    }

    return NextResponse.json({ ok: json?.data?.contactUs?.status === true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}
