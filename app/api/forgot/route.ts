import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

const RESET_MUTATION = `
  mutation RequestPasswordReset($email: String!) {
    requestPasswordResetEmail(email: $email)
  }
`;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders() as Record<string, string>,
      body: JSON.stringify({ query: RESET_MUTATION, variables: { email } }),
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    const gqlError = json?.errors?.[0]?.message;

    if (gqlError) {
      return NextResponse.json({ error: gqlError }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Something went wrong." }, { status: 500 });
  }
}
