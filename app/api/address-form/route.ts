import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { ATTRIBUTES_FORM_QUERY } from "@/lib/queries";

export const dynamic = "force-dynamic";

type GqlResult = {
  data?: {
    attributesForm?: {
      items?: FormField[];
      errors?: { message: string }[];
    };
  } | null;
  errors?: { message: string }[];
};

export type FormField = {
  code: string;
  label: string;
  frontend_input: string;
  frontend_class: string | null;
  default_value: string | null;
  is_required: boolean;
  options: { label: string; value: string }[];
};

export async function GET(req: NextRequest) {
  const formCode = req.nextUrl.searchParams.get("formCode");
  if (!formCode) {
    return NextResponse.json({ error: "formCode is required" }, { status: 400 });
  }

  try {
    const headers = magentoHeaders() as Record<string, string>;
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: ATTRIBUTES_FORM_QUERY, variables: { formCode } }),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => ({}))) as GqlResult;

    if (!res.ok && !json?.data) {
      return NextResponse.json({ error: "Magento request failed", items: [] }, { status: 502 });
    }

    if (json?.data === null) {
      const msg = json?.errors?.[0]?.message ?? "attributesForm returned null data";
      console.error("[address-form] Magento returned null data:", msg);
      return NextResponse.json({ error: msg, items: [] });
    }

    const formErrors = json?.data?.attributesForm?.errors ?? [];
    if (formErrors.length) {
      return NextResponse.json({ error: formErrors[0].message, items: [] });
    }

    if (json?.errors?.length) {
      console.warn("[address-form] GraphQL warnings:", json.errors.map(e => e.message));
    }

    const items: FormField[] = json?.data?.attributesForm?.items ?? [];
    return NextResponse.json({ items });

  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch address form fields" },
      { status: 502 },
    );
  }
}
