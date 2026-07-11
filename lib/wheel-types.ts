/* ─────────────────────────────────────────────────────────────────
   WHEEL API — TypeScript interfaces
   Endpoint: https://wheel-api.klever.ae/graphql.php
   Auth:      ?user_key=<key> appended to URL — never in headers or body.
   Schema verified via introspection on 2026-07-06.
───────────────────────────────────────────────────────────────── */

/** Standard GraphQL error shape. */
export interface WheelApiError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
}

/** Top-level GraphQL response envelope. */
export interface WheelApiResponse<T = Record<string, unknown>> {
  data?: T;
  errors?: WheelApiError[];
}

/* ── Raw API types — mirror the verified GraphQL schema ─────────── */

/** Vehicle manufacturer. Identifier is `slug` (e.g. "toyota"), not a numeric id. */
export interface WheelMake {
  slug: string;
  name: string;
  logo?: string | null;
}

/** Vehicle model within a make. Identifier is `slug` (e.g. "camry"). */
export interface WheelModel {
  slug: string;
  name: string;
}

/**
 * Production year entry.
 * Both `slug` and `name` are integers (the calendar year).
 * Use `slug` as the identifier when calling modifications().
 */
export interface WheelYear {
  slug: number;
  name: number;
}

/** Engine power output. */
export interface WheelPower {
  hp?: number | null;
  kw?: number | null;
  ps?: number | null;
}

/** Engine specification. */
export interface WheelEngine {
  fuel?:     string | null;
  capacity?: string | null;
  type?:     string | null;
  code?:     string | null;
  power:     WheelPower;
}

/**
 * A single engine / trim modification for a vehicle year.
 * Represents one variant (e.g. "2.5 VVT-i Petrol 178 hp").
 */
export interface WheelModification {
  slug?:      string | null;
  name?:      string | null;
  trim?:      string | null;
  startYear?: number | null;
  endYear?:   number | null;
  engine:     WheelEngine;
}

/**
 * A single result from search(width, height, rim).
 * Describes a vehicle that uses the queried tyre size as front and/or rear fitment.
 */
export interface WheelSearchMatch {
  makeName:    string;
  modelName:   string;
  makeSlug?:   string | null;
  modelSlug?:  string | null;
  /** JSON-encoded array of year ranges, e.g. '["2004-2013","2015-2026"]' */
  yearRanges?: string | null;
  frontWidth?:  number | null;
  frontHeight?: number | null;
  frontRim?:    number | null;
  rearWidth?:   number | null;
  rearHeight?:  number | null;
  rearRim?:     number | null;
  isStock:      boolean;
}

/* ── GraphQL result wrapper types (one per query) ───────────────── */

export interface WheelMakesResult   { makes:         { count: number; data: WheelMake[]         } }
export interface WheelModelsResult  { models:        { count: number; data: WheelModel[]        } }
export interface WheelYearsResult   { years:         { count: number; data: WheelYear[]         } }
export interface WheelModificationsResult { modifications: { count: number; data: WheelModification[] } }
export interface WheelSearchResult  { search:        { count: number; data: WheelSearchMatch[]  } }

/* ── Normalized output types — used by lib/wheel-service.ts ─────── */

/** Normalized make option for dropdowns / vehicle selectors. */
export interface WheelMakeOption {
  slug: string;
  name: string;
  logo?: string | null;
}

/** Normalized model option. */
export interface WheelModelOption {
  slug: string;
  name: string;
}

/** Normalized year option. Value is an integer year. */
export interface WheelYearOption {
  year: number;
}

/** Normalized modification (trim/engine variant). */
export interface WheelModificationOption {
  slug:     string;
  name:     string;
  trim?:    string | null;
  fuel?:    string | null;
  capacity?: string | null;
  hp?:      number | null;
}

/** Normalized search result item (vehicle matching a tyre size). */
export interface WheelFitmentMatch {
  makeName:   string;
  modelName:  string;
  makeSlug:   string;
  modelSlug:  string;
  yearRanges: string[];
  front: { width: number | null; height: number | null; rim: number | null };
  rear:  { width: number | null; height: number | null; rim: number | null };
  isStock: boolean;
}
