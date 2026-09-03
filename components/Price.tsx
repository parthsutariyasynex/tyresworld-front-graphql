"use client";
import React from "react";
import { useCurrencyCode } from "@/lib/store-config-context";

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

/** Currency codes/glyphs that represent the UAE Dirham */
const AED_CODES = new Set(["AED", "د.إ", "Dhs", "DH"]);

/** Currency codes/glyphs that represent the Saudi Riyal */
const SAR_CODES = new Set(["SAR", "ر.س", "﷼"]);

export function isAed(code?: string | null): boolean {
  return !code || AED_CODES.has(code);
}

export function isRiyal(code?: string | null): boolean {
  return code ? SAR_CODES.has(code) : false;
}

/** Currency label — UAE Dirham gets the UAEDirham font; Saudi Riyal gets saudi-riyal glyph. */
export function Currency({ code }: { code?: string }) {
  const storeCurrency = useCurrencyCode();
  const resolved = code || storeCurrency;
  if (isRiyal(resolved)) {
    return (
      <span className="currency-riyal" aria-label="SAR">
        {"#"}
      </span>
    );
  }
  if (isAed(resolved)) {
    return (
      <span className="currency-dirham" aria-label="AED" role="img">
        {"\uE900"}
      </span>
    );
  }
  return <>{resolved}</>;
}

type MoneyProps = {
  value: number;
  /** ISO code from Magento; falls back to the store's currency. */
  currency?: string;
  /** Fixed fraction digits (min = max). Omit for the locale default. */
  digits?: number;
};

/** Renders "⃁ 1,352.00" — riyal symbol (or currency code) first, then the amount. */
export function Money({ value, currency, digits }: MoneyProps) {
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
