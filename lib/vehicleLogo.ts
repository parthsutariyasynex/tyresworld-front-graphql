import { APP_CONFIG } from "@/src/config/app-config";

/**
 * Vehicle-make logo assets live on the storefront's static Magento theme
 * folder (Hdweb_Vehicles), which — like the rest of the staging origin —
 * sits behind HTTP Basic Auth. A plain <img src="https://www1.tyresworld.ae/...">
 * from the browser has no credentials, so every logo request comes back
 * 401 and silently disappears (VehicleFitmentModal's onError hides it).
 *
 * The fix: never point <img> at the staging origin directly. Build the
 * make-slug filename here, and let /api/vehicle-logo fetch it server-side
 * (where magentoHeaders() adds the Basic Auth header) and stream the bytes
 * back same-origin.
 */
export const MAGENTO_ORIGIN = APP_CONFIG.magento.graphqlUrl.replace(/\/graphql\/?$/, "");

export const VEHICLE_LOGO_BASE =
  `${MAGENTO_ORIGIN}/static/frontend/Klever/automotive/en_US/Hdweb_Vehicles/images/logo`;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/i;

/** true for a safe, non-traversable make slug like "bmw" or "aston-martin". */
export function isValidVehicleLogoSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/** Same-origin URL the browser can safely load; proxied by /api/vehicle-logo. */
export function vehicleLogoProxyUrl(slug: string): string {
  return `/api/vehicle-logo/${encodeURIComponent(slug)}.png`;
}
