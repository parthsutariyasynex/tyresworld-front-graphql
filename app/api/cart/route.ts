import { NextRequest, NextResponse } from "next/server";
import { CART_QUERIES as Q } from "@/lib/cart-queries";

/* ─────────────────────────────────────────────────────────────────
   Server-side proxy for the Magento GraphQL cart + guest checkout.
   Single POST endpoint; the operation is selected by body.op.
───────────────────────────────────────────────────────────────── */
const GRAPHQL_URL =
  (process.env.MAGENTO_GRAPHQL_URL ?? "https://www.tyrescart.ae/graphql").replace(/\/$/, "");
const TOKEN = process.env.MAGENTO_API_TOKEN ?? "";

type Gql = { data?: Record<string, unknown>; errors?: { message: string }[] };

async function gql(query: string, variables: Record<string, unknown>): Promise<Gql> {
  const headers: HeadersInit = { Accept: "application/json", "Content-Type": "application/json" };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
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
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const op = body.op as string;
  const cartId = body.cartId as string | undefined;

  try {
    switch (op) {
      case "create": {
        const j = await gql(Q.create, {});
        return NextResponse.json({ cartId: j.data?.createEmptyCart ?? null, error: err(j) });
      }
      case "get": {
        const j = await gql(Q.get, { cartId });
        return NextResponse.json({ cart: j.data?.cart ?? null, error: err(j) });
      }
      case "add": {
        const j = await gql(Q.add, { cartId, sku: body.sku, qty: body.qty ?? 1 });
        const r = j.data?.addProductsToCart as { cart?: unknown; user_errors?: { message: string }[] } | undefined;
        return NextResponse.json({
          cart: r?.cart ?? null,
          userError: r?.user_errors?.[0]?.message ?? null,
          error: err(j),
        });
      }
      case "update": {
        const j = await gql(Q.update, { cartId, uid: body.uid, qty: body.qty });
        return NextResponse.json({ cart: (j.data?.updateCartItems as { cart?: unknown })?.cart ?? null, error: err(j) });
      }
      case "remove": {
        const j = await gql(Q.remove, { cartId, uid: body.uid });
        return NextResponse.json({ cart: (j.data?.removeItemFromCart as { cart?: unknown })?.cart ?? null, error: err(j) });
      }
      case "applyCoupon": {
        const j = await gql(Q.applyCoupon, { cartId, code: body.code });
        return NextResponse.json({ cart: (j.data?.applyCouponToCart as { cart?: unknown })?.cart ?? null, error: err(j) });
      }
      case "removeCoupon": {
        const j = await gql(Q.removeCoupon, { cartId });
        return NextResponse.json({ cart: (j.data?.removeCouponFromCart as { cart?: unknown })?.cart ?? null, error: err(j) });
      }
      case "setEmail": {
        const j = await gql(Q.setEmail, { cartId, email: body.email });
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }
      case "setShippingAddress": {
        const j = await gql(Q.setShippingAddress, { cartId, addr: body.address });
        return NextResponse.json({ cart: (j.data?.setShippingAddressesOnCart as { cart?: unknown })?.cart ?? null, error: err(j) });
      }
      case "setShippingMethod": {
        const j = await gql(Q.setShippingMethod, { cartId, carrier: body.carrier, method: body.method });
        return NextResponse.json({ cart: (j.data?.setShippingMethodsOnCart as { cart?: unknown })?.cart ?? null, error: err(j) });
      }
      case "setBilling": {
        const j = await gql(Q.setBilling, { cartId, addr: body.address });
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }
      case "setPayment": {
        const j = await gql(Q.setPayment, { cartId, code: body.code });
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }
      case "placeOrder": {
        const j = await gql(Q.placeOrder, { cartId });
        const order = (j.data?.placeOrder as { order?: { order_number?: string } })?.order;
        return NextResponse.json({ orderNumber: order?.order_number ?? null, error: err(j) });
      }
      default:
        return NextResponse.json({ error: `Unknown cart op: ${op}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cart request failed" },
      { status: 502 }
    );
  }
}
