import { NextRequest, NextResponse } from "next/server";
import { RECAPTCHA_V3_CONFIG_QUERY, RECAPTCHA_FORM_CONFIG_QUERY } from "@/lib/queries";
import { getCapabilities } from "@/lib/magento-capabilities";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

export const dynamic = "force-dynamic";

type Gql = { data?: Record<string, unknown>; errors?: { message: string }[] };

async function gql(query: string, variables?: Record<string, unknown>): Promise<Gql> {
  const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
    method:  "POST",
    headers: magentoHeaders(),
    body:    JSON.stringify({ query, variables: variables ?? {} }),
    cache:   "no-store",
  });
  return (await res.json().catch(() => ({}))) as Gql;
}

/* GET /api/recaptcha            — global reCAPTCHA v3 config (or enabled:false)
 * GET /api/recaptcha?form=CONTACT — per-form config (PLACE_ORDER, CUSTOMER_LOGIN, …) */
export async function GET(req: NextRequest) {
  const form = new URL(req.url).searchParams.get("form");

  try {
    const caps = await getCapabilities();

    // Dormant until enabled in Magento Admin — never breaks the calling form.
    if (!caps.recaptcha.installed || !caps.recaptcha.enabled) {
      return NextResponse.json({ enabled: false, config: null, error: null });
    }

    if (form) {
      const j = await gql(RECAPTCHA_FORM_CONFIG_QUERY, { formType: form });
      const cfg = j.data?.recaptchaFormConfig ?? null;
      return NextResponse.json({
        enabled: (cfg as { is_enabled?: boolean } | null)?.is_enabled === true,
        config:  cfg,
        error:   j.errors?.[0]?.message ?? null,
      });
    }

    const j = await gql(RECAPTCHA_V3_CONFIG_QUERY);
    return NextResponse.json({
      enabled: true,
      config:  j.data?.recaptchaV3Config ?? null,
      error:   j.errors?.[0]?.message ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { enabled: false, config: null, error: e instanceof Error ? e.message : "reCAPTCHA lookup failed" },
      { status: 502 },
    );
  }
}
