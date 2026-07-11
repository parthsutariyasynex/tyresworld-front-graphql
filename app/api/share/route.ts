import { NextRequest, NextResponse } from "next/server";
import { SHARE_MUTATIONS } from "@/lib/mutations";
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

/* POST /api/share
   Body: { productId, senderName, senderEmail, senderMessage, recipients: [{name, email}] }
*/
export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({} as Record<string, unknown>));
  const token = body.token as string | undefined;

  try {
    const j = await gql(SHARE_MUTATIONS.sendEmail, {
      input: {
        product_id: body.productId,
        sender: { name: body.senderName, email: body.senderEmail, message: body.senderMessage ?? "" },
        recipients: body.recipients ?? [],
      },
    }, token);

    return NextResponse.json({ ok: !err(j), error: err(j) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Share request failed" }, { status: 502 });
  }
}
