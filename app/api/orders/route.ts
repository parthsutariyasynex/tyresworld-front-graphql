import { NextRequest, NextResponse } from "next/server";
import { GUEST_ORDER_QUERY, GUEST_ORDER_BY_TOKEN_QUERY } from "@/lib/queries";
import { ORDER_MUTATIONS } from "@/lib/mutations";
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
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return (await res.json().catch(() => ({}))) as Gql;
}

const err = (j: Gql) => j?.errors?.[0]?.message;

/* GET /api/orders?number=ORD-001&email=a@b.com&postcode=12345
 * GET /api/orders?token=<order-token>  */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const number = searchParams.get("number");
  const email = searchParams.get("email");
  const lastname = searchParams.get("lastname");

  try {
    if (token) {
      const j = await gql(GUEST_ORDER_BY_TOKEN_QUERY, { token });
      return NextResponse.json({ order: j.data?.guestOrderByToken ?? null, error: err(j) });
    }

    if (!number || !email || !lastname) {
      return NextResponse.json(
        { order: null, error: "number, email and lastname are required" },
        { status: 400 },
      );
    }

    const j = await gql(GUEST_ORDER_QUERY, { number, email, lastname });
    return NextResponse.json({ order: j.data?.guestOrder ?? null, error: err(j) });
  } catch (e) {
    return NextResponse.json(
      { order: null, error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}

/* POST /api/orders  op: reorder | cancel | requestGuestCancel */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const op = body.op as string;
  const token = body.token as string | undefined;

  try {
    switch (op) {

      case "reorder": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ORDER_MUTATIONS.reorder, { orderNumber: body.orderNumber }, token);
        const r = j.data?.reorderItems as {
          cart?: { id: string };
          userInputErrors?: { message: string }[];
        } | undefined;
        return NextResponse.json({
          cartId: r?.cart?.id ?? null,
          userErrors: r?.userInputErrors ?? [],
          error: err(j),
        });
      }

      case "cancel": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ORDER_MUTATIONS.cancel, {
          orderId: body.orderId,
          reason: body.reason ?? "",
        }, token);
        const r = j.data?.cancelOrder as { error?: string; order?: { status: string } } | undefined;
        return NextResponse.json({ status: r?.order?.status ?? null, error: r?.error ?? err(j) });
      }

      case "requestGuestCancel": {
        const j = await gql(ORDER_MUTATIONS.requestGuestCancel, {
          number: body.number,
          reason: body.reason ?? "",
        });
        const r = j.data?.requestGuestOrderCancel as {
          error?: string;
          order?: { status: string };
        } | undefined;
        return NextResponse.json({ status: r?.order?.status ?? null, error: r?.error ?? err(j) });
      }

      case "confirmGuestCancel": {
        const j = await gql(ORDER_MUTATIONS.confirmGuestCancel, {
          number: body.number,
          uid: body.uid,
        });
        const r = j.data?.confirmCancelOrder as {
          error?: string;
          order?: { status: string };
        } | undefined;
        return NextResponse.json({ status: r?.order?.status ?? null, error: r?.error ?? err(j) });
      }

      case "createPaymentOrder": {
        const { cartId: cpoCartId, methodCode, paymentSource, location, vaultIntent } =
          body as { cartId?: string; methodCode?: string; paymentSource?: string; location?: string; vaultIntent?: boolean };

        if (!cpoCartId) return NextResponse.json({ paymentOrder: null, error: "cartId is required" }, { status: 400 });
        if (!methodCode) return NextResponse.json({ paymentOrder: null, error: "methodCode is required" }, { status: 400 });
        if (!paymentSource) return NextResponse.json({ paymentOrder: null, error: "paymentSource is required" }, { status: 400 });

        const j = await gql(ORDER_MUTATIONS.createPaymentOrder, {
          cartId: cpoCartId,
          methodCode,
          paymentSource,
          location: location ?? "CHECKOUT",
          vaultIntent: vaultIntent ?? false,
        }, token);

        const r = j.data?.createPaymentOrder as {
          id?: string;
          mp_order_id?: string;
          status?: string;
          amount?: number;
          currency_code?: string;
        } | undefined;

        if (j.errors?.length) {
          return NextResponse.json({ paymentOrder: null, error: j.errors[0].message }, { status: 400 });
        }

        return NextResponse.json({ paymentOrder: r ?? null, error: null });
      }

      case "syncPaymentOrder": {
        const { cartId: sCartId, id: sId } = body as { cartId?: string; id?: string };
        if (!sCartId) return NextResponse.json({ synced: false, error: "cartId is required" }, { status: 400 });
        if (!sId) return NextResponse.json({ synced: false, error: "id is required" }, { status: 400 });

        const j = await gql(ORDER_MUTATIONS.syncPaymentOrder, { cartId: sCartId, id: sId }, token);

        if (j.errors?.length) {
          return NextResponse.json({ synced: false, error: j.errors[0].message }, { status: 400 });
        }

        return NextResponse.json({ synced: j.data?.syncPaymentOrder === true, error: null });
      }

      case "completeOrder": {
        const { cartId, id } = body as { cartId?: string; id?: string };

        if (!cartId) return NextResponse.json({ order: null, errors: [], error: "cartId is required" }, { status: 400 });
        if (!id) return NextResponse.json({ order: null, errors: [], error: "id is required" }, { status: 400 });

        const j = await gql(ORDER_MUTATIONS.completeOrder, { cartId, id }, token);

        // Top-level GraphQL error (network, auth, server crash)
        if (j.errors?.length) {
          const msg = j.errors[0].message;
          // Translate opaque backend errors into user-friendly messages
          const friendly = msg.includes("Private key signing failed")
            ? "Payment session expired. Please restart checkout."
            : msg.includes("not authorized") || msg.includes("Unauthorized")
              ? "Session expired. Please log in and try again."
              : msg;
          return NextResponse.json({ order: null, errors: [], error: friendly }, { status: 400 });
        }

        const r = j.data?.completeOrder as {
          errors?: { code: string; message: string }[];
          orderV2?: {
            available_actions: string[];
            carrier: string | null;
            email: string | null;
            id: string;
            is_virtual: boolean;
            number: string;
            order_date: string;
            order_status_change_date: string;
            shipping_method: string | null;
            status: string;
            token: string;
            total?: { grand_total?: { value: number; currency: string } };
          } | null;
        } | undefined;

        // Mutation-level errors returned by Magento inside data.completeOrder.errors[]
        const mutationErrors = r?.errors ?? [];
        if (mutationErrors.length) {
          return NextResponse.json({
            order: null,
            errors: mutationErrors,
            error: mutationErrors[0].message,
          }, { status: 422 });
        }

        return NextResponse.json({
          order: r?.orderV2 ?? null,
          errors: [],
          error: null,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown orders op: ${op}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Orders request failed" },
      { status: 502 },
    );
  }
}
