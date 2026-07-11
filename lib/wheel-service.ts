/* ─────────────────────────────────────────────────────────────────
   WHEEL API — service layer
   Call these functions from Server Components or Server Actions only.
   They run with the WHEEL_USER_KEY secret on the server — they must
   never be imported into "use client" components directly.

   Architecture:
     Server Component / Server Action
       → wheel-service  (this file — typed business logic)
       → wheel-client   (wheelGql — raw fetch, appends ?user_key=)
       → wheel-queries  (verified GraphQL query strings)
       → wheel-types    (TypeScript interfaces)

   The Wheel API is a vehicle fitment database:
   - Browse: makes → models → years → modifications (engine trims)
   - Reverse: search(width, height, rim) → vehicles that use that size
───────────────────────────────────────────────────────────────── */

import { wheelGql } from "@/lib/wheel-client";
import {
  WHEEL_MAKES_QUERY,
  WHEEL_MODELS_QUERY,
  WHEEL_YEARS_QUERY,
  WHEEL_MODIFICATIONS_QUERY,
  WHEEL_SEARCH_QUERY,
} from "@/lib/wheel-queries";
import type {
  WheelMakesResult,
  WheelModelsResult,
  WheelYearsResult,
  WheelModificationsResult,
  WheelSearchResult,
  WheelMakeOption,
  WheelModelOption,
  WheelYearOption,
  WheelModificationOption,
  WheelFitmentMatch,
} from "@/lib/wheel-types";

/* ── Cache TTLs ────────────────────────────────────────────────── */
const TTL_CATALOG = 3600;   // makes / models / years — very stable
const TTL_TRIMS   = 3600;   // modifications — stable
const TTL_SEARCH  = 300;    // reverse fitment search — fresher

/* ── Generic result wrapper ────────────────────────────────────── */
export interface WheelResult<T> {
  data: T;
  error?: string;
}

/* ─────────────────────────────────────────────────────────────────
   getMakes
   All vehicle manufacturers. Optionally filter by region.
   Result cached 1 h via Next.js ISR.
───────────────────────────────────────────────────────────────── */
export interface GetMakesParams {
  region?:   string;
  ordering?: string;
  limit?:    number;
  offset?:   number;
}

export async function getMakes(
  params: GetMakesParams = {},
): Promise<WheelResult<WheelMakeOption[]>> {
  const res = await wheelGql<WheelMakesResult>(
    WHEEL_MAKES_QUERY,
    params as Record<string, unknown>,
    { revalidate: TTL_CATALOG },
  );

  if (res.errors?.length) {
    return { data: [], error: res.errors[0].message };
  }

  const data: WheelMakeOption[] = (res.data?.makes?.data ?? []).map((m) => ({
    slug: m.slug,
    name: m.name,
    logo: m.logo ?? null,
  }));

  return { data };
}

/* ─────────────────────────────────────────────────────────────────
   getModels
   Models for a make slug (e.g. "toyota").
   Slugs — not numeric IDs — are the identifiers throughout this API.
───────────────────────────────────────────────────────────────── */
export interface GetModelsParams {
  make:      string;
  ordering?: string;
  limit?:    number;
  offset?:   number;
}

export async function getModels(
  params: GetModelsParams,
): Promise<WheelResult<WheelModelOption[]>> {
  const res = await wheelGql<WheelModelsResult>(
    WHEEL_MODELS_QUERY,
    params as unknown as Record<string, unknown>,
    { revalidate: TTL_CATALOG },
  );

  if (res.errors?.length) {
    return { data: [], error: res.errors[0].message };
  }

  const data: WheelModelOption[] = (res.data?.models?.data ?? []).map((m) => ({
    slug: m.slug,
    name: m.name,
  }));

  return { data };
}

/* ─────────────────────────────────────────────────────────────────
   getYears
   Production years for a make + model slug combination.
   Returns years in descending order (newest first from the API).
───────────────────────────────────────────────────────────────── */
export async function getYears(
  make: string,
  model: string,
): Promise<WheelResult<WheelYearOption[]>> {
  const res = await wheelGql<WheelYearsResult>(
    WHEEL_YEARS_QUERY,
    { make, model },
    { revalidate: TTL_CATALOG },
  );

  if (res.errors?.length) {
    return { data: [], error: res.errors[0].message };
  }

  const data: WheelYearOption[] = (res.data?.years?.data ?? []).map((y) => ({
    year: y.slug,   // slug === name === the integer year
  }));

  return { data };
}

/* ─────────────────────────────────────────────────────────────────
   getModifications
   Engine / trim variants for a specific make + model + year.
   `year` must be an integer (e.g. 2022).
   Each modification represents one engine/trim combination.
───────────────────────────────────────────────────────────────── */
export async function getModifications(
  make: string,
  model: string,
  year: number,
): Promise<WheelResult<WheelModificationOption[]>> {
  const res = await wheelGql<WheelModificationsResult>(
    WHEEL_MODIFICATIONS_QUERY,
    { make, model, year },
    { revalidate: TTL_TRIMS },
  );

  if (res.errors?.length) {
    return { data: [], error: res.errors[0].message };
  }

  const data: WheelModificationOption[] = (res.data?.modifications?.data ?? []).map((m) => ({
    slug:     m.slug     ?? "",
    name:     m.name     ?? "",
    trim:     m.trim     ?? null,
    fuel:     m.engine?.fuel     ?? null,
    capacity: m.engine?.capacity ?? null,
    hp:       m.engine?.power?.hp ?? null,
  }));

  return { data };
}

/* ─────────────────────────────────────────────────────────────────
   searchByTyreSize
   Reverse fitment lookup: given a tyre size (width/height/rim),
   return all vehicles that use it as a stock or compatible fitment.
   Useful for "which cars fit 225/45R17?" search flows.
───────────────────────────────────────────────────────────────── */
export async function searchByTyreSize(
  width: number,
  height: number,
  rim: number,
): Promise<WheelResult<WheelFitmentMatch[]>> {
  const res = await wheelGql<WheelSearchResult>(
    WHEEL_SEARCH_QUERY,
    { width, height, rim },
    { revalidate: TTL_SEARCH },
  );

  if (res.errors?.length) {
    return { data: [], error: res.errors[0].message };
  }

  const data: WheelFitmentMatch[] = (res.data?.search?.data ?? []).map((m) => ({
    makeName:  m.makeName,
    modelName: m.modelName,
    makeSlug:  m.makeSlug  ?? "",
    modelSlug: m.modelSlug ?? "",
    yearRanges: m.yearRanges
      ? (() => { try { return JSON.parse(m.yearRanges as string); } catch { return []; } })()
      : [],
    front: { width: m.frontWidth ?? null, height: m.frontHeight ?? null, rim: m.frontRim ?? null },
    rear:  { width: m.rearWidth  ?? null, height: m.rearHeight  ?? null, rim: m.rearRim  ?? null },
    isStock: m.isStock,
  }));

  return { data };
}
