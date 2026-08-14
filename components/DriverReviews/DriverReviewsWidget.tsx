"use client";

/* ─────────────────────────────────────────────────────────────────
   DriverReviews widget container.

   Renders the <div class="driverreviews-widget" data-…> that the SDK
   scans and fills. One component, two variants (props, not duplicate
   components):
     - "product" → PDP combined-review widget  (product_review.phtml)
     - "rating"  → listing-card rating widget   (category_rating.phtml)

   Render rules (mirror the Luma templates):
     - only tyres get a widget (is_tyre)
     - need at least a manufacturer or model, else the SDK can't match
     - the "rating" variant is gated on show_category_rating
───────────────────────────────────────────────────────────────── */

import type { DriverReviewsData } from "@/lib/data";
import { useDriverReviews } from "@/lib/driver-reviews-context";

type Variant = "product" | "rating";

export default function DriverReviewsWidget({
  dr,
  variant = "product",
}: {
  dr?: DriverReviewsData | null;
  variant?: Variant;
}) {
  const cfg = useDriverReviews();

  // SDK not booted / feature off.
  if (!cfg) return null;
  // Only tyres, and only when the SDK has something to match on.
  if (!dr?.isTyre || (!dr.manufacturer && !dr.model)) return null;
  // Listing rating is gated on the admin toggle.
  if (variant === "rating" && !cfg.show_category_rating) return null;

  // data-* attributes: set only the ones that have a value.
  const attrs: Record<string, string> = {};
  if (dr.manufacturer) attrs["data-manufacturer"] = dr.manufacturer;
  if (dr.model) attrs["data-model"] = dr.model;
  if (dr.vehicleType) attrs["data-vehicle-type"] = dr.vehicleType;

  if (variant === "rating") {
    return (
      <div className="driverreviews-category-rating">
        <div
          className="driverreviews-widget"
          data-type="rating"
          {...attrs}
          data-review-link=""
        />
      </div>
    );
  }

  // "product" (PDP) combined-review widget.
  const productAttrs: Record<string, string> = { ...attrs };
  if (dr.tyreSize) productAttrs["data-relevant-tyre-size"] = dr.tyreSize;
  if (cfg.review_size) productAttrs["data-review-size"] = String(cfg.review_size);
  if (cfg.infinite_scroll) productAttrs["data-infinite-scroll"] = "";
  if (cfg.show_external_reviews) productAttrs["data-show-external-review-link"] = "";

  return (
    <div className="driverreviews-product-widget">
      <div
        className="driverreviews-widget"
        data-type={cfg.product_widget_type}
        {...productAttrs}
        data-additional-car-results=""
      />
    </div>
  );
}
