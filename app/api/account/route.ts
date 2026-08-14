import { NextRequest, NextResponse } from "next/server";
import { AUTH_QUERIES, CUSTOMER_ORDER_DETAIL_QUERY, IS_EMAIL_AVAILABLE_QUERY, WISHLIST_QUERY, CUSTOMER_DOWNLOADABLE_PRODUCTS_QUERY } from "@/lib/queries";
import { AUTH_MUTATIONS, ACCOUNT_MUTATIONS, ADDRESS_MUTATIONS, PAYMENT_TOKEN_MUTATIONS, CUSTOMER_PAYMENT_TOKENS_QUERY, WISHLIST_MUTATIONS } from "@/lib/mutations";
import { hasOperation, featureUnavailable } from "@/lib/magento-capabilities";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { readAuthToken, setAuthCookie, clearAuthCookie } from "@/lib/auth-cookie";


const Q = { ...AUTH_QUERIES, ...AUTH_MUTATIONS };

type Gql = { data?: any; errors?: { message: string }[] };

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
    body:   JSON.stringify({ query, variables }),
    cache:  "no-store",
  });
  return (await res.json().catch(() => ({}))) as Gql;
}

const err = (j: Gql) => j?.errors?.[0]?.message;

export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({} as Record<string, unknown>));
  const op    = body.op as string;
  // Cookie is authoritative; body.token kept only as a transitional fallback.
  const token = readAuthToken(req) ?? (body.token as string | undefined);

  try {
    switch (op) {

      /* ── Auth ──────────────────────────────────────────────────── */
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
        // Set the token in an httpOnly cookie; never return it to JS.
        const res = NextResponse.json({ ok: !!t, error: err(j) });
        if (t) setAuthCookie(res, t);
        return res;
      }

      case "customer": {
        if (!token) return NextResponse.json({ customer: null, error: "Not authenticated" }, { status: 401 });
        const j = await gql(Q.customer, {}, token);
        return NextResponse.json({ customer: j.data?.customer ?? null, error: err(j) });
      }

      case "logout": {
        if (token) await gql(Q.logout, {}, token);
        const res = NextResponse.json({ ok: true });
        clearAuthCookie(res);
        return res;
      }

      case "orderDetail": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(CUSTOMER_ORDER_DETAIL_QUERY, { number: body.number }, token);
        const items = (j.data?.customer as { orders?: { items?: unknown[] } })?.orders?.items ?? [];
        return NextResponse.json({ order: items[0] ?? null, error: err(j) });
      }

      /* ── Email availability ────────────────────────────────────── */
      case "isEmailAvailable": {
        const j = await gql(IS_EMAIL_AVAILABLE_QUERY, { email: body.email });
        const available = (j.data?.isEmailAvailable as { is_email_available?: boolean })?.is_email_available ?? null;
        return NextResponse.json({ available, error: err(j) });
      }

      /* ── Password reset ────────────────────────────────────────── */
      case "requestPasswordReset": {
        const j = await gql(ACCOUNT_MUTATIONS.requestPasswordReset, { email: body.email });
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      case "resetPassword": {
        const j = await gql(ACCOUNT_MUTATIONS.resetPassword, {
          email:              body.email,
          resetPasswordToken: body.resetPasswordToken,
          newPassword:        body.newPassword,
        });
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      /* ── Profile ───────────────────────────────────────────────── */
      case "updateProfile": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ACCOUNT_MUTATIONS.updateProfile, { input: body.input }, token);
        const customer = (j.data?.updateCustomerV2 as { customer?: unknown })?.customer;
        return NextResponse.json({ customer: customer ?? null, error: err(j) });
      }

      case "changePassword": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ACCOUNT_MUTATIONS.changePassword, {
          currentPassword: body.currentPassword,
          newPassword:     body.newPassword,
        }, token);
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      case "updateEmail": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ACCOUNT_MUTATIONS.updateEmail, {
          email:    body.email,
          password: body.password,
        }, token);
        const customer = (j.data?.updateCustomerEmail as { customer?: unknown })?.customer;
        return NextResponse.json({ customer: customer ?? null, error: err(j) });
      }

      case "subscribe": {
        const j = await gql(ACCOUNT_MUTATIONS.subscribe, { email: body.email });
        const status = (j.data?.subscribeEmailToNewsletter as { status?: string })?.status;
        return NextResponse.json({ status: status ?? null, error: err(j) });
      }

      /* ── Address book ──────────────────────────────────────────── */
      case "createAddress": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ADDRESS_MUTATIONS.create, { input: body.input }, token);
        return NextResponse.json({ address: j.data?.createCustomerAddress ?? null, error: err(j) });
      }

      case "updateAddress": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ADDRESS_MUTATIONS.update, { id: body.id, input: body.input }, token);
        return NextResponse.json({ address: j.data?.updateCustomerAddress ?? null, error: err(j) });
      }

      case "deleteAddress": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ADDRESS_MUTATIONS.delete, { id: body.id }, token);
        return NextResponse.json({ ok: !!j.data?.deleteCustomerAddress, error: err(j) });
      }

      /* ── Email verification ───────────────────────────────────────── */
      case "confirmEmail": {
        const j = await gql(ACCOUNT_MUTATIONS.confirmEmail, { email: body.email, confirmationKey: body.confirmationKey });
        const result = j.data?.confirmEmail as { customer?: unknown; token?: string } | undefined;
        // Auto-login on confirmation: set the cookie, don't expose the token.
        const res = NextResponse.json({ ok: !err(j), error: err(j) });
        if (result?.token) setAuthCookie(res, result.token);
        return res;
      }

      case "resendConfirmationEmail": {
        const j = await gql(ACCOUNT_MUTATIONS.resendConfirmationEmail, { email: body.email });
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      /* ── Account deletion ─────────────────────────────────────────── */
      case "deleteCustomer": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(ACCOUNT_MUTATIONS.deleteCustomer, {}, token);
        return NextResponse.json({ ok: !!j.data?.deleteCustomer, error: err(j) });
      }

      /* ── Saved payment tokens ────────────────────────────────────── */
      case "paymentTokens": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(CUSTOMER_PAYMENT_TOKENS_QUERY, {}, token);
        const items = (j.data?.customerPaymentTokens as { items?: unknown[] })?.items ?? [];
        return NextResponse.json({ tokens: items, error: err(j) });
      }

      case "deletePaymentToken": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(PAYMENT_TOKEN_MUTATIONS.delete, { publicHash: body.publicHash }, token);
        return NextResponse.json({ ok: !err(j), error: err(j) });
      }

      /* ── Downloadable products (capability-gated) ─────────────────── */
      /* Dormant while the catalog has no downloadable products;
       * activates automatically if the module/type is ever used. */
      case "downloadableProducts": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        if (!(await hasOperation("customerDownloadableProducts", "query")))
          return NextResponse.json({ items: [], ...featureUnavailable("Downloadable products") });
        const j = await gql(CUSTOMER_DOWNLOADABLE_PRODUCTS_QUERY, {}, token);
        const items = (j.data?.customerDownloadableProducts as { items?: unknown[] } | null)?.items ?? [];
        return NextResponse.json({ items, error: err(j) });
      }

      /* ── Wishlist Operations ───────────────────────────────────────── */
      case "wishlist": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const j = await gql(WISHLIST_QUERY, {}, token);
        const wishlist = j.data?.customer?.wishlist_v2 ?? null;
        return NextResponse.json({ wishlist, error: err(j) });
      }

      case "addWishlist": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        let wishlistId = body.wishlistId as string;
        if (!wishlistId) {
          const w = await gql(WISHLIST_QUERY, {}, token);
          wishlistId = w.data?.customer?.wishlist_v2?.id as string;
        }
        if (!wishlistId) return NextResponse.json({ error: "Could not retrieve wishlist ID" }, { status: 400 });
        const j = await gql(WISHLIST_MUTATIONS.add, {
          wishlistId,
          wishlistItems: [{ sku: body.sku, quantity: body.qty ?? 1 }]
        }, token);
        const userErrors = j.data?.addProductsToWishlist?.user_errors ?? [];
        const errorMsg = userErrors[0]?.message ?? err(j);
        return NextResponse.json({
          wishlist: j.data?.addProductsToWishlist?.wishlist ?? null,
          error: errorMsg || null
        });
      }

      case "removeWishlist": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        let wishlistId = body.wishlistId as string;
        if (!wishlistId) {
          const w = await gql(WISHLIST_QUERY, {}, token);
          wishlistId = w.data?.customer?.wishlist_v2?.id as string;
        }
        if (!wishlistId) return NextResponse.json({ error: "Could not retrieve wishlist ID" }, { status: 400 });
        const j = await gql(WISHLIST_MUTATIONS.remove, {
          wishlistId,
          wishlistItemsIds: Array.isArray(body.itemId) ? body.itemId : [body.itemId]
        }, token);
        const userErrors = j.data?.removeProductsFromWishlist?.user_errors ?? [];
        const errorMsg = userErrors[0]?.message ?? err(j);
        return NextResponse.json({
          wishlist: j.data?.removeProductsFromWishlist?.wishlist ?? null,
          error: errorMsg || null
        });
      }

      case "moveWishlistToCart": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        let wishlistId = body.wishlistId as string;
        if (!wishlistId) {
          const w = await gql(WISHLIST_QUERY, {}, token);
          wishlistId = w.data?.customer?.wishlist_v2?.id as string;
        }
        if (!wishlistId) return NextResponse.json({ error: "Could not retrieve wishlist ID" }, { status: 400 });
        const j = await gql(WISHLIST_MUTATIONS.moveToCart, {
          wishlistId,
          wishlistItemsIds: Array.isArray(body.itemId) ? body.itemId : [body.itemId]
        }, token);
        const userErrors = j.data?.addWishlistItemsToCart?.add_wishlist_items_to_cart_user_errors ?? [];
        const errorMsg = userErrors[0]?.message ?? err(j);
        return NextResponse.json({
          wishlist: j.data?.addWishlistItemsToCart?.wishlist ?? null,
          status: j.data?.addWishlistItemsToCart?.status ?? false,
          error: errorMsg || null
        });
      }

      case "updateWishlistItem": {
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        let wishlistId = body.wishlistId as string;
        if (!wishlistId) {
          const w = await gql(WISHLIST_QUERY, {}, token);
          wishlistId = w.data?.customer?.wishlist_v2?.id as string;
        }
        if (!wishlistId) return NextResponse.json({ error: "Could not retrieve wishlist ID" }, { status: 400 });
        const j = await gql(WISHLIST_MUTATIONS.updateItem, {
          wishlistId,
          itemId:   body.itemId,
          quantity: body.quantity ?? 1,
        }, token);
        const userErrors = (j.data?.updateProductsInWishlist as { user_errors?: { message: string }[] } | undefined)?.user_errors ?? [];
        const errorMsg = userErrors[0]?.message ?? err(j);
        return NextResponse.json({
          wishlist: (j.data?.updateProductsInWishlist as { wishlist?: unknown } | undefined)?.wishlist ?? null,
          error: errorMsg || null,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown account op: ${op}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Account request failed" },
      { status: 502 },
    );
  }
}
