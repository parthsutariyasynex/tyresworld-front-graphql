"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/* ─────────────────────────────────────────────────────────────────
   ProductImage
   A drop-in wrapper around next/image for PRODUCT images that come
   from the Magento API (e.g. www.tyrescart.ae media URLs).

   Why this exists:
   Next.js' image optimizer (/_next/image) fetches the external URL
   server-side, runs it through sharp, then serves it. For an
   external Magento media host that is slow, rate-limited, behind a
   self-signed cert, or returns 404 for un-generated cache images,
   that server-side fetch fails and surfaces as:
     • /_next/image 500
     • ETIMEDOUT
     • upstream 404

   This component:
     1. Sets `unoptimized` so Next emits the raw URL into a plain
        <img> and the BROWSER loads it directly — no server-side
        optimizer fetch, so none of the above failures can occur.
     2. Keeps the API image URL completely unchanged.
     3. Falls back to a local, always-available placeholder ONLY when
        the URL is null/empty or the image genuinely fails to load.
───────────────────────────────────────────────────────────────── */

const FALLBACK_SRC = "/placeholder-product.svg";

type ProductImageProps = Omit<ImageProps, "src" | "onError"> & {
  /** API image URL — may be null/empty; rendered verbatim when present. */
  src?: string | null;
};

export default function ProductImage({ src, alt, ...rest }: ProductImageProps) {
  const hasSrc = typeof src === "string" && src.trim() !== "";
  const [imgSrc, setImgSrc] = useState<string>(hasSrc ? (src as string) : FALLBACK_SRC);

  return (
    <Image
      {...rest}
      // Bypass /_next/image — load the API URL directly in the browser.
      unoptimized
      src={imgSrc}
      alt={alt}
      onError={() => {
        // Swap to the local placeholder only on a real load failure.
        if (imgSrc !== FALLBACK_SRC) setImgSrc(FALLBACK_SRC);
      }}
    />
  );
}
