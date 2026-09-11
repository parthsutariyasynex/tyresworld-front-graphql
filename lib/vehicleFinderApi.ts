/**
 * Thin client fetch layer over the existing `/api/tyre-finder/vehicle`
 * route (Klever_PartsFinder cascade: makes → models → years → trims →
 * sizes). No backend logic here — this only calls the same, already-live
 * API the homepage "Search By Vehicle" finder (components/TyreFinder.tsx)
 * uses, so both surfaces share one source of truth server-side.
 *
 * Used by the /tyres/cars vehicle-brand browser pages.
 */

export type VehicleOption = {
  label: string;
  value: string;
  logo?: string;
  fuel?: string | null;
  hp?: number | null;
};

export type VehicleSize = {
  width: string;
  height: string;
  rim: string;
  rear: { width: string; height: string; rim: string } | null;
  isFactory: boolean;
  speedIndex: string | null;
  rearSpeedIndex: string | null;
  label: string;
  rearLabel: string | null;
};

type StepParams = Record<string, string>;

async function fetchOptions(
  step: string,
  params: StepParams,
  locale: string,
  signal?: AbortSignal,
): Promise<{ options: VehicleOption[]; error?: string }> {
  const qs = new URLSearchParams({ ...params, step, store: locale }).toString();
  const res = await fetch(`/api/tyre-finder/vehicle?${qs}`, { signal });
  const data = await res.json().catch(() => ({}));
  return { options: data.options ?? [], error: data.error };
}

export function fetchMakes(locale: string, signal?: AbortSignal) {
  return fetchOptions("makes", {}, locale, signal);
}

export function fetchModels(make: string, locale: string, signal?: AbortSignal) {
  return fetchOptions("models", { make }, locale, signal);
}

export function fetchYears(make: string, model: string, locale: string, signal?: AbortSignal) {
  return fetchOptions("years", { make, model }, locale, signal);
}

export function fetchTrims(
  make: string,
  model: string,
  year: string,
  locale: string,
  signal?: AbortSignal,
) {
  return fetchOptions("trims", { make, model, year }, locale, signal);
}

export async function fetchSizes(
  make: string,
  model: string,
  year: string,
  modification: string,
  locale: string,
  signal?: AbortSignal,
): Promise<{ sizes: VehicleSize[]; error?: string }> {
  const qs = new URLSearchParams({
    make,
    model,
    year,
    modification,
    step: "sizes",
    store: locale,
  }).toString();
  const res = await fetch(`/api/tyre-finder/vehicle?${qs}`, { signal });
  const data = await res.json().catch(() => ({}));
  return { sizes: data.sizes ?? [], error: data.error };
}
