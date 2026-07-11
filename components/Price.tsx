import React from "react";

/* ─────────────────────────────────────────────────────────────────
   Shared price rendering.

   Every place that displays a price must go through <Money /> (or
   <Currency /> for a bare currency label) so the Saudi Riyal glyph
   font applies consistently everywhere. Do NOT format prices with
   page-local template strings — that bypasses the riyal font.

   SAR prices always render symbol-first: "⃁ 1,352.00" (the riyal
   glyph, then the amount). The .currency-riyal class applies the
   'saudi-riyal' icon font, which maps "#" to the official symbol.
───────────────────────────────────────────────────────────────── */

/** Currency codes/glyphs that represent the Saudi Riyal */
const SAR_CODES = new Set(["SAR", "ر.س", "﷼"]);

export function isRiyal(code?: string | null): boolean {
  return !code || SAR_CODES.has(code);
}

/** Currency label — Saudi Riyal gets the riyal-symbol glyph; other currencies render as plain text.
 *  The vendored 'saudi-riyal' icon font maps "#" (U+0023) to the official Riyal symbol. */
export function Currency({ code = "SAR" }: { code?: string }) {
  if (isRiyal(code)) {
    return (
      <span className="currency-riyal" aria-label="SAR">
        {"#"}
      </span>
    );
  }
  return <>{code}</>;
}

type MoneyProps = {
  value: number;
  /** ISO code from Magento (defaults to SAR) */
  currency?: string;
  /** Fixed fraction digits (min = max). Omit for the locale default. */
  digits?: number;
};

/** Renders "⃁ 1,352.00" — riyal symbol (or currency code) first, then the amount. */
export function Money({ value, currency = "SAR", digits }: MoneyProps) {
  const formatted = value.toLocaleString(
    undefined,
    digits === undefined
      ? undefined
      : { minimumFractionDigits: digits, maximumFractionDigits: digits },
  );

  return (
    <>
      <Currency code={currency} /> {formatted}
    </>
  );
}
