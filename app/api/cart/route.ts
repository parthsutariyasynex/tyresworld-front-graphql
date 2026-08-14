import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth-cookie";
import { CART_QUERIES } from "@/lib/queries";
import { CART_MUTATIONS, PRODUCT_TYPE_CART_MUTATIONS, LEGACY_CART_MUTATIONS } from "@/lib/mutations";
import { hasOperation, supportedProductTypes, featureUnavailable } from "@/lib/magento-capabilities";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

const Q = { ...CART_QUERIES, ...CART_MUTATIONS };

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

const err = (j: Gql) => j?.errors?.[0]?.message;

/** Magento ≥2.4.6 returns cart items under itemsV2 { items }.
 *  Normalise so the client always sees a flat `items` array. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCart(cart: Record<string, any> | null | undefined): Record<string, any> | null {
  if (!cart) return null;
  const flat = { ...cart };
  if (flat.itemsV2?.items) {
    flat.items = flat.itemsV2.items;
  } else if (!flat.items) {
    flat.items = [];
  }
  return flat;
}

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => ({} as Record<string, unknown>));
  const op     = body.op as string;
  const cartId = body.cartId as string | undefined;
  const token  = readAuthToken(req) ?? (body.token as string | undefined);

  try {
    switch (op) {

      /* ── create ──────────────────────────────────────────────── */
      case "create": {
        const j   = await gql(Q.create, {}, token);
        const raw = j.data?.createGuestCart;
        // Magento 2.4.6+ returns CreateGuestCartOutput { cart { id } }; older instances return scalar String.
        const id  = typeof raw === "string"
          ? raw
          : (raw as { cart?: { id?: string } } | undefined)?.cart?.id ?? null;
        return NextResponse.json({ cartId: id, error: err(j) });
      }

      /* ── get customer cart id ────────────────────────────────── */
      case "customerCart": {
        if (!token) return NextResponse.json({ cartId: null, error: "Not authenticated" }, { status: 401 });
        const j  = await gql(Q.customerCartId, {}, token);
        const id = (j.data?.customerCart as { id?: string } | undefined)?.id ?? null;
        return NextResponse.json({ cartId: id, error: err(j) });
      }

      /* ── merge guest cart into customer cart ─────────────────── */
      case "mergeCart": {
        if (!token) return NextResponse.json({ cart: null, error: "Not authenticated" }, { status: 401 });
        const j   = await gql(Q.mergeCart, {
          guestCartId:    body.guestCartId,
          customerCartId: body.customerCartId,
        }, token);
        const raw = j.data?.mergeCarts as Record<string, unknown> | undefined;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      /* ── get ─────────────────────────────────────────────────── */
      case "get": {
        const j = await gql(Q.get, { cartId }, token);
        return NextResponse.json({
          cart:  normalizeCart(j.data?.cart as Record<string, unknown>),
          error: err(j),
        });
      }

      /* ── add ─────────────────────────────────────────────────── */
      case "add": {
        // Accept cartItems array; fall back to legacy sku/qty shape for safety
        const cartItems = (body.cartItems as { sku: string; quantity: number }[] | undefined)
          ?? (body.sku ? [{ sku: body.sku as string, quantity: (body.qty as number) ?? 1 }] : []);

        if (!cartItems.length) {
          return NextResponse.json({ cart: null, userError: "No items specified", error: null });
        }

        const j = await gql(Q.add, { cartId, cartItems }, token);
        const r = j.data?.addProductsToCart as {
          cart?: Record<string, unknown>;
          user_errors?: { code: string; message: string }[];
        } | undefined;

        let userError = r?.user_errors?.[0]?.message ?? null;

        // Magento bug: OUT_OF_STOCK products incorrectly surface as PRODUCT_NOT_FOUND.
        // Cross-check stock status and return an accurate message.
        if (r?.user_errors?.[0]?.code === "PRODUCT_NOT_FOUND" && cartItems[0]?.sku) {
          const stockJ = await gql(
            `query($sku:String!){products(filter:{sku:{eq:$sku}}){items{stock_status}}}`,
            { sku: cartItems[0].sku },
          );
          const stockStatus = (stockJ.data?.products as { items?: { stock_status?: string }[] } | undefined)
            ?.items?.[0]?.stock_status;
          if (stockStatus === "OUT_OF_STOCK") {
            userError = "This product is currently out of stock.";
          }
        }

        return NextResponse.json({
          cart:      normalizeCart(r?.cart ?? null),
          userError,
          error:     err(j),
        });
      }

      /* ── update qty ──────────────────────────────────────────── */
      case "update": {
        const j   = await gql(Q.update, { cartId, uid: body.uid, qty: body.qty }, token);
        const raw = (j.data?.updateCartItems as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      /* ── remove item ─────────────────────────────────────────── */
      case "remove": {
        const j   = await gql(Q.remove, { cartId, uid: body.uid }, token);
        const raw = (j.data?.removeItemFromCart as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      /* ── apply coupon ────────────────────────────────────────── */
      case "applyCoupon": {
        const j   = await gql(Q.applyCoupon, { cartId, code: body.code }, token);
        const raw = (j.data?.applyCouponToCart as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      /* ── remove coupon ───────────────────────────────────────── */
      case "removeCoupon": {
        const j   = await gql(Q.removeCoupon, { cartId }, token);
        const raw = (j.data?.removeCouponFromCart as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      /* ── set guest email ─────────────────────────────────────── */
      case "setEmail": {
        // setGuestEmailOnCart only applies to guest carts.
        // For authenticated customer carts the email is already on the account — skip silently.
        if (token) return NextResponse.json({ ok: true, error: null });
        const j = await gql(Q.setEmail, { cartId, email: body.email });
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      /* ── set shipping address ────────────────────────────────── */
      case "setShippingAddress": {
        const j   = await gql(Q.setShippingAddress, { cartId, addr: body.address }, token);
        const raw = (j.data?.setShippingAddressesOnCart as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      /* ── set shipping method ─────────────────────────────────── */
      case "setShippingMethod": {
        const j   = await gql(Q.setShippingMethod, { cartId, carrier: body.carrier, method: body.method }, token);
        const raw = (j.data?.setShippingMethodsOnCart as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      /* ── set billing address ────────────────────────────────── */
      case "setBilling": {
        const j = await gql(Q.setBilling, { cartId, addr: body.address }, token);
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      /* ── set payment method ──────────────────────────────────── */
      case "setPayment": {
        const j = await gql(Q.setPayment, { cartId, code: body.code }, token);
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      /* ── place order ─────────────────────────────────────────── */
      case "placeOrder": {
        const j = await gql(Q.placeOrder, { cartId }, token);
        // PlaceOrderOutput on this store: { errors[]{code,message}, orderV2{number} } — no `order` field
        const r = j.data?.placeOrder as {
          errors?: { code: string; message: string }[];
          orderV2?: { number?: string } | null;
        } | undefined;
        const mutationError = r?.errors?.[0]?.message ?? null;
        const gqlError      = err(j) ?? null;
        return NextResponse.json({
          orderNumber: r?.orderV2?.number ?? null,
          error:       mutationError ?? gqlError,
        });
      }

      /* ── create cart + add items in one round-trip ───────────── */
      case "addToNewCart": {
        const j = await gql(Q.addToNewCart, { cartItems: body.cartItems }, token);
        const r = j.data?.addProductsToNewCart as { cart?: Record<string, unknown>; user_errors?: { message: string }[] } | undefined;
        return NextResponse.json({
          cart:      normalizeCart(r?.cart ?? null),
          userError: r?.user_errors?.[0]?.message ?? null,
          error:     err(j),
        });
      }

      /* ── mark cart inactive (logout / store-switch / pre-redirect) ── */
      case "setInactive": {
        if (!cartId) {
          return NextResponse.json({ success: false, error: "cartId is required" }, { status: 400 });
        }
        console.log("[cart/setInactive]", { cartId, variables: { cartId } });
        const j  = await gql(Q.setInactive, { cartId }, token);
        const r  = j.data?.setCartAsInactive as { success?: boolean; error?: string | null } | undefined;
        return NextResponse.json({
          success: r?.success ?? false,
          error:   r?.error ?? err(j) ?? null,
        });
      }

      /* ── product-type add-to-cart (capability-gated) ─────────── */
      /* Dormant unless the product type exists on the platform;
       * activates automatically when Magento supports it. */

      case "addBundle": {
        if (!(await supportedProductTypes()).includes("BUNDLE"))
          return NextResponse.json({ cart: null, ...featureUnavailable("Bundle products") });
        const j = await gql(PRODUCT_TYPE_CART_MUTATIONS.addBundle, { cartId, cartItems: body.cartItems }, token);
        const raw = (j.data?.addBundleProductsToCart as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      case "addVirtual": {
        if (!(await supportedProductTypes()).includes("VIRTUAL"))
          return NextResponse.json({ cart: null, ...featureUnavailable("Virtual products") });
        const j = await gql(PRODUCT_TYPE_CART_MUTATIONS.addVirtual, { cartId, cartItems: body.cartItems }, token);
        const raw = (j.data?.addVirtualProductsToCart as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      case "addDownloadable": {
        if (!(await supportedProductTypes()).includes("DOWNLOADABLE"))
          return NextResponse.json({ cart: null, ...featureUnavailable("Downloadable products") });
        const j = await gql(PRODUCT_TYPE_CART_MUTATIONS.addDownloadable, { cartId, cartItems: body.cartItems }, token);
        const raw = (j.data?.addDownloadableProductsToCart as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      /* ── deprecated compatibility wrappers ───────────────────── */
      /* Modern addProductsToCart is preferred; the legacy mutation
       * is used only when the modern one is absent from the schema. */

      case "addSimple":
      case "addConfigurable": {
        const items = (body.cartItems as { data?: { sku?: string; quantity?: number }; parent_sku?: string }[] | undefined) ?? [];
        if (await hasOperation("addProductsToCart", "mutation")) {
          const cartItems = items.map(i => ({
            sku:        op === "addConfigurable" ? (i.data?.sku ?? "") : (i.data?.sku ?? ""),
            quantity:   i.data?.quantity ?? 1,
            parent_sku: i.parent_sku,
          }));
          const j = await gql(Q.add, { cartId, cartItems }, token);
          const r = j.data?.addProductsToCart as { cart?: Record<string, unknown>; user_errors?: { message: string }[] } | undefined;
          return NextResponse.json({
            cart:      normalizeCart(r?.cart ?? null),
            userError: r?.user_errors?.[0]?.message ?? null,
            error:     err(j),
          });
        }
        const legacy = op === "addSimple" ? LEGACY_CART_MUTATIONS.addSimple : LEGACY_CART_MUTATIONS.addConfigurable;
        const field  = op === "addSimple" ? "addSimpleProductsToCart" : "addConfigurableProductsToCart";
        const j = await gql(legacy, { cartId, cartItems: items }, token);
        const raw = (j.data?.[field] as { cart?: Record<string, unknown> } | undefined)?.cart;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
      }

      case "assignToCustomer": {
        if (!token) return NextResponse.json({ cart: null, error: "Not authenticated" }, { status: 401 });
        // Prefer modern mergeCarts; fall back to the deprecated mutation.
        if (await hasOperation("mergeCarts", "mutation")) {
          const { cartId: customerCartId } = await gql(Q.customerCartId, {}, token)
            .then(r => ({ cartId: (r.data?.customerCart as { id?: string } | undefined)?.id }));
          if (customerCartId && cartId && customerCartId !== cartId) {
            const j = await gql(Q.mergeCart, { guestCartId: cartId, customerCartId }, token);
            const raw = j.data?.mergeCarts as Record<string, unknown> | undefined;
            return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
          }
          const j = await gql(Q.get, { cartId: customerCartId ?? cartId }, token);
          return NextResponse.json({ cart: normalizeCart(j.data?.cart as Record<string, unknown>), error: err(j) });
        }
        const j = await gql(LEGACY_CART_MUTATIONS.assignCustomerToGuestCart, { cartId }, token);
        const raw = j.data?.assignCustomerToGuestCart as Record<string, unknown> | undefined;
        return NextResponse.json({ cart: normalizeCart(raw ?? null), error: err(j) });
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
