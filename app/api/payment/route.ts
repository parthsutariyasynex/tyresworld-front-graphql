import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth-cookie";
import {
  PAYMENT_CONFIG_QUERY,
  PAYMENT_SDK_QUERY,
  PAYMENT_ORDER_QUERY,
  VAULT_CONFIG_QUERY,
  HOSTED_PRO_URL_QUERY,
  PAYFLOW_LINK_TOKEN_QUERY,
} from "@/lib/queries";
import { PAYPAL_MUTATIONS, VAULT_MUTATIONS, ORDER_MUTATIONS } from "@/lib/mutations";
import {
  hasOperation,
  isPaypalEnabled,
  isVaultEnabled,
  featureUnavailable,
} from "@/lib/magento-capabilities";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

export const dynamic = "force-dynamic";

type Gql = { data?: Record<string, unknown>; errors?: { message: string }[] };

async function gql(query: string, variables: Record<string, unknown>, token?: string): Promise<Gql> {
  const headers = magentoHeaders() as Record<string, string>;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
    method:  "POST",
    headers,
    body:    JSON.stringify({ query, variables }),
    cache:   "no-store",
  });
  return (await res.json().catch(() => ({}))) as Gql;
}

const err = (j: Gql) => j?.errors?.[0]?.message ?? null;
const ok  = (data: unknown, error: string | null = null) =>
  NextResponse.json({ supported: true, data, error });

/* POST /api/payment — capability-gated payment operations.
 *
 * Every op is dormant until the matching feature is enabled in Magento
 * Admin, and activates automatically when it is (no code changes):
 * disabled features return { supported:false, error } with HTTP 200 so
 * checkout never breaks.
 *
 * ops:
 *   paymentConfig | paymentSDK | paymentOrder | createPaymentOrder |
 *   syncPaymentOrder | completeOrder                        (gateway SDK)
 *   paypalExpressToken | payflowProToken | payflowLinkToken |
 *   hostedProUrl | handlePayflowPro                         (PayPal)
 *   vaultConfig | vaultSetupToken | vaultPaymentToken       (saved cards)
 */
export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({} as Record<string, unknown>));
  const op    = body.op as string;
  const token = readAuthToken(req) ?? (body.token as string | undefined);

  try {
    switch (op) {

      /* ── Payment-gateway SDK (payment-services) ─────────────── */

      case "paymentConfig": {
        if (!(await hasOperation("getPaymentConfig", "query")))
          return NextResponse.json(featureUnavailable("Payment gateway SDK"));
        const j = await gql(PAYMENT_CONFIG_QUERY, { location: body.location ?? "CHECKOUT" }, token);
        return ok(j.data?.getPaymentConfig ?? null, err(j));
      }

      case "paymentSDK": {
        if (!(await hasOperation("getPaymentSDK", "query")))
          return NextResponse.json(featureUnavailable("Payment gateway SDK"));
        const j = await gql(PAYMENT_SDK_QUERY, { location: body.location ?? "CHECKOUT" }, token);
        return ok(j.data?.getPaymentSDK ?? null, err(j));
      }

      case "paymentOrder": {
        if (!(await hasOperation("getPaymentOrder", "query")))
          return NextResponse.json(featureUnavailable("Payment gateway SDK"));
        const j = await gql(PAYMENT_ORDER_QUERY, { cartId: body.cartId, id: body.id }, token);
        return ok(j.data?.getPaymentOrder ?? null, err(j));
      }

      case "createPaymentOrder": {
        if (!(await hasOperation("createPaymentOrder", "mutation")))
          return NextResponse.json(featureUnavailable("Payment gateway SDK"));
        const j = await gql(ORDER_MUTATIONS.createPaymentOrder, {
          cartId:        body.cartId,
          methodCode:    body.methodCode,
          paymentSource: body.paymentSource,
          location:      body.location ?? "CHECKOUT",
          vaultIntent:   body.vaultIntent ?? false,
        }, token);
        return ok(j.data?.createPaymentOrder ?? null, err(j));
      }

      case "syncPaymentOrder": {
        if (!(await hasOperation("syncPaymentOrder", "mutation")))
          return NextResponse.json(featureUnavailable("Payment gateway SDK"));
        const j = await gql(ORDER_MUTATIONS.syncPaymentOrder, { cartId: body.cartId, id: body.id }, token);
        return ok(j.data?.syncPaymentOrder ?? null, err(j));
      }

      case "completeOrder": {
        if (!(await hasOperation("completeOrder", "mutation")))
          return NextResponse.json(featureUnavailable("Payment gateway SDK"));
        const j = await gql(ORDER_MUTATIONS.completeOrder, { cartId: body.cartId, id: body.id }, token);
        return ok(j.data?.completeOrder ?? null, err(j));
      }

      /* ── PayPal ─────────────────────────────────────────────── */

      case "paypalExpressToken": {
        if (!(await hasOperation("createPaypalExpressToken", "mutation")) || !(await isPaypalEnabled()))
          return NextResponse.json(featureUnavailable("PayPal"));
        const j = await gql(PAYPAL_MUTATIONS.expressToken, {
          cartId:        body.cartId,
          code:          body.code ?? "paypal_express",
          expressButton: body.expressButton ?? false,
          urls:          body.urls,
        }, token);
        return ok(j.data?.createPaypalExpressToken ?? null, err(j));
      }

      case "payflowProToken": {
        if (!(await hasOperation("createPayflowProToken", "mutation")) || !(await isPaypalEnabled()))
          return NextResponse.json(featureUnavailable("PayPal Payflow Pro"));
        const j = await gql(PAYPAL_MUTATIONS.payflowProToken, { cartId: body.cartId, urls: body.urls }, token);
        return ok(j.data?.createPayflowProToken ?? null, err(j));
      }

      case "payflowLinkToken": {
        if (!(await hasOperation("getPayflowLinkToken", "query")) || !(await isPaypalEnabled()))
          return NextResponse.json(featureUnavailable("PayPal Payflow Link"));
        const j = await gql(PAYFLOW_LINK_TOKEN_QUERY, { cartId: body.cartId }, token);
        return ok(j.data?.getPayflowLinkToken ?? null, err(j));
      }

      case "hostedProUrl": {
        if (!(await hasOperation("getHostedProUrl", "query")) || !(await isPaypalEnabled()))
          return NextResponse.json(featureUnavailable("PayPal Hosted Pro"));
        const j = await gql(HOSTED_PRO_URL_QUERY, { cartId: body.cartId }, token);
        return ok(j.data?.getHostedProUrl ?? null, err(j));
      }

      case "handlePayflowPro": {
        if (!(await hasOperation("handlePayflowProResponse", "mutation")) || !(await isPaypalEnabled()))
          return NextResponse.json(featureUnavailable("PayPal Payflow Pro"));
        const j = await gql(PAYPAL_MUTATIONS.handlePayflowPro, {
          cartId:        body.cartId,
          paypalPayload: body.paypalPayload,
        }, token);
        return ok(j.data?.handlePayflowProResponse ?? null, err(j));
      }

      /* ── Vault (saved-card checkout) ────────────────────────── */

      case "vaultConfig": {
        if (!(await hasOperation("getVaultConfig", "query")))
          return NextResponse.json(featureUnavailable("Saved-card payments"));
        const j = await gql(VAULT_CONFIG_QUERY, {}, token);
        return ok(j.data?.getVaultConfig ?? null, err(j));
      }

      case "vaultSetupToken": {
        if (!(await isVaultEnabled()))
          return NextResponse.json(featureUnavailable("Saved-card payments"));
        if (!token) return NextResponse.json({ supported: true, data: null, error: "Not authenticated" }, { status: 401 });
        const j = await gql(VAULT_MUTATIONS.createSetupToken, { input: body.input }, token);
        return ok(j.data?.createVaultCardSetupToken ?? null, err(j));
      }

      case "vaultPaymentToken": {
        if (!(await isVaultEnabled()))
          return NextResponse.json(featureUnavailable("Saved-card payments"));
        if (!token) return NextResponse.json({ supported: true, data: null, error: "Not authenticated" }, { status: 401 });
        const j = await gql(VAULT_MUTATIONS.createPaymentToken, {
          setupTokenId:    body.setupTokenId,
          cardDescription: body.cardDescription ?? null,
        }, token);
        return ok(j.data?.createVaultCardPaymentToken ?? null, err(j));
      }

      default:
        return NextResponse.json({ supported: false, data: null, error: `Unknown payment op: ${op}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { supported: true, data: null, error: e instanceof Error ? e.message : "Payment request failed" },
      { status: 502 },
    );
  }
}
