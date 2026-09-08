/**
 * /api/tyre-finder/vehicle — vehicle cascade for the Tyre Finder's
 * "Search By Vehicle" tab, backed by Magento's Klever_PartsFinder module.
 *
 * WHY NOT THE OTHER TWO SOURCES
 *   Magento GraphQL: `vehicle` is filterable but no product carries it
 *   (products(filter:{vehicle:{eq:"3579"}}) → total_count 0 for all 18
 *   options), `model` is not filterable at all, and `year` is the tyre's
 *   production year, not the vehicle's. So a vehicle selection can never
 *   filter the catalog directly.
 *
 *   The Wheel API (lib/wheel-service.ts): has makes/models/years/trims but
 *   its schema exposes no forward tyre-size lookup — only the reverse
 *   search(width,height,rim) — so it cannot turn a trim into a size.
 *
 *   Klever_PartsFinder resolves a trim to the fitment sizes, and those sizes
 *   filter on width/height/rim, which products DO carry. That is the whole
 *   point of routing through here.
 *
 * STEPS
 *   ?step=makes
 *   ?step=models&make=bmw
 *   ?step=years&make=bmw&model=3-series
 *   ?step=trims&make=bmw&model=3-series&year=2022
 *   ?step=sizes&make=bmw&model=3-series&year=2022&modification=cafc866f97
 *
 * Responses: { options: [...] } for the first four, { sizes: [...] } for the
 * last. Nothing is synthesised — an upstream failure returns an empty list
 * plus `error`.
 */
import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

const ORIGIN = APP_CONFIG.magento.graphqlUrl.replace(/\/graphql\/?$/, "");

/** Make logos are served off the Wheel API host, keyed by make slug — the
    same path the live theme's finder uses; the controller sends logo_url empty. */
const LOGO_BASE = "https://wheel-api.klever.ae/logos";

/** The fitment database is effectively static; sizes change no faster. */
const TTL = 86_400;

type Option = {
  label: string;
  value: string;
  logo?: string;
  fuel?: string | null;
  hp?: number | null;
};

type TyreSize = {
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

/** POST a partsfinder controller. Not GraphQL — these are theme AJAX endpoints. */
async function pf<T>(
  path: string,
  body: Record<string, string>,
  store: string,
): Promise<{ json?: T; error?: string }> {
  const storePath = store === "ar" ? "ar" : "en";
  try {
    const res = await fetch(`${ORIGIN}/${storePath}/partsfinder/${path}`, {
      method: "POST",
      headers: {
        ...(magentoHeaders(store) as Record<string, string>),
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
      body: new URLSearchParams(body).toString(),
      next: { revalidate: TTL },
    });
    if (!res.ok) return { error: `Partsfinder HTTP ${res.status}` };
    const json = (await res.json().catch(() => null)) as T | null;
    return json ? { json } : { error: "Partsfinder returned invalid JSON" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
}

/* ── Size row parsing ──────────────────────────────────────────────
   getsearchbymodel is the only endpoint that maps a trim to fitment
   sizes and it answers in rendered theme HTML. The authoritative values
   are the onclick arguments the theme attaches to each row:
     showproduct('225','50','17')                  front only
     showproduct('225','45','18','255','40','18')  staggered front/rear
   The rest is the metadata shown beside the size: an `oem` class marks the
   factory fitment, speed-index-label-1/-2 carry front/rear load-speed
   indices. */
const SHOWPRODUCT_RE = /showproduct\(\s*((?:'[^']*'\s*,?\s*)+)\)/i;
const ARG_RE = /'([^']*)'/g;
const SPEED_1_RE = /speed-index-label-1"[^>]*>([^<]+)</i;
const SPEED_2_RE = /speed-index-label-2"[^>]*>([^<]+)</i;

function parseSizeRow(html: string): TyreSize | null {
  const call = SHOWPRODUCT_RE.exec(html);
  if (!call) return null;

  const args = [...call[1].matchAll(ARG_RE)].map((m) => m[1].trim());
  const [width, height, rim, rearWidth, rearHeight, rearRim] = args;

  // Without a complete front size the row cannot filter products.
  if (!width || !height || !rim) return null;

  const hasRear = Boolean(rearWidth && rearHeight && rearRim);

  return {
    width,
    height,
    rim,
    rear: hasRear ? { width: rearWidth, height: rearHeight, rim: rearRim } : null,
    isFactory: /<li[^>]*class="[^"]*\boem\b/i.test(html),
    speedIndex: SPEED_1_RE.exec(html)?.[1]?.trim() || null,
    rearSpeedIndex: hasRear ? SPEED_2_RE.exec(html)?.[1]?.trim() || null : null,
    label: `${width}/${height}R${rim}`,
    rearLabel: hasRear ? `${rearWidth}/${rearHeight}R${rearRim}` : null,
  };
}

/** Make names arrive HTML-escaped in the markup (e.g. "Mercedes &amp; Co"). */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* ── Handler ───────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const step = searchParams.get("step") ?? "makes";
  const store = searchParams.get("store") === "ar" ? "ar" : "en";
  const make = searchParams.get("make") ?? "";
  const model = searchParams.get("model") ?? "";
  const year = searchParams.get("year") ?? "";
  const modification = searchParams.get("modification") ?? "";

  const fail = (error: string, status = 200) =>
    NextResponse.json(step === "sizes" ? { sizes: [], error } : { options: [], error }, { status });

  const ok = (payload: { options: Option[] } | { sizes: TyreSize[] }) =>
    NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" },
    });

  if (step === "makes") {
    /* getvehiclelist, not vehicle/getMakes.
       getMakes returns the whole upstream database — 171 makes, of which 80 are
       not in the storefront's own list and have no logo file (…/logos/<slug>.png
       404s for all of them). getvehiclelist is the curated list the live finder
       renders: 118 makes, each with the logo URL already resolved, and it
       includes 27 makes getMakes omits entirely (abarth, jetour, jaecoo,
       hongqi, ineos …) that the model cascade serves fine.
       It answers in rendered HTML, so the make and its logo are read from the
       markup: onclick="getmodel('<slug>' , '<name>')" plus the row's <img>. */
    const { json, error } = await pf<{ response?: string }>(
      "ajax/getvehiclelist",
      {},
      store,
    );
    if (error) return fail(error);

    const html = json?.response;
    if (!html) return fail("Makes unavailable");

    const options: Option[] = [];
    const seen = new Set<string>();
    for (const row of html.split("<li").slice(1)) {
      const m = /getmodel\('([^']+)'\s*,\s*'([^']*)'\)/.exec(row);
      if (!m) continue;
      const slug = m[1].trim();
      const label = decodeEntities(m[2]).trim();
      if (!slug || !label || seen.has(slug)) continue;
      seen.add(slug);
      const logo = /<img[^>]+src="([^"]+)"/.exec(row)?.[1]?.trim();
      options.push({ label, value: slug, logo: logo || `${LOGO_BASE}/${slug}.png` });
    }

    if (!options.length) return fail("Makes unavailable");
    return ok({ options });
  }

  if (step === "models") {
    if (!make) return fail("make is required", 400);
    type Up = { status?: string; models?: { slug?: string; name?: string; name_en?: string }[] };
    const { json, error } = await pf<Up>("vehicle/getModels", { make }, store);
    if (error) return fail(error);
    if (json?.status !== "success") return fail("Models unavailable");

    const options = (json.models ?? [])
      .map((m): Option | null => {
        const slug = m.slug?.trim();
        const label = (m.name || m.name_en)?.trim();
        return slug && label ? { label, value: slug } : null;
      })
      .filter((o): o is Option => o !== null);

    return ok({ options });
  }

  if (step === "years") {
    if (!make || !model) return fail("make and model are required", 400);
    type Up = { status?: string; years?: number[] };
    const { json, error } = await pf<Up>("vehicle/getYears", { make, model }, store);
    if (error) return fail(error);
    if (json?.status !== "success") return fail("Years unavailable");

    const options = (json.years ?? [])
      .filter((y) => Number.isFinite(Number(y)))
      .map((y) => ({ label: String(y), value: String(y) }));

    return ok({ options });
  }

  if (step === "trims") {
    if (!make || !model || !year) return fail("make, model and year are required", 400);
    type Up = {
      status?: string;
      modifications?: {
        slug?: string;
        name?: string;
        trim?: string;
        engine?: { fuel?: string; power?: { hp?: number } | null } | null;
      }[];
    };
    const { json, error } = await pf<Up>(
      "vehicle/getModifications",
      { make, model, year },
      store,
    );
    if (error) return fail(error);
    if (json?.status !== "success") return fail("Trims unavailable");

    const options = (json.modifications ?? [])
      .map((m): Option | null => {
        const slug = m.slug?.trim();
        const label = (m.name || m.trim)?.trim();
        if (!slug || !label) return null;
        return {
          label,
          value: slug,
          fuel: m.engine?.fuel?.trim() || null,
          hp: m.engine?.power?.hp ?? null,
        };
      })
      .filter((o): o is Option => o !== null);

    return ok({ options });
  }

  if (step === "sizes") {
    if (!make || !model || !year || !modification) {
      return fail("make, model, year and modification are required", 400);
    }
    type Up = { enginesTyre?: string[]; wheelsTyre?: string[] };
    const { json, error } = await pf<Up>(
      "ajax/getsearchbymodel",
      { make, model, year, modification },
      store,
    );
    if (error) return fail(error);

    /* The theme renders enginesTyre and wheelsTyre into one list, so both hold
       size rows; reading only the first would drop valid fitments. */
    const rows = [...(json?.enginesTyre ?? []), ...(json?.wheelsTyre ?? [])];

    const seen = new Set<string>();
    const sizes: TyreSize[] = [];
    for (const row of rows) {
      const size = parseSizeRow(row);
      if (!size) continue;
      const key = `${size.label}|${size.rearLabel ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sizes.push(size);
    }

    // Factory fitment first, then by rim diameter.
    sizes.sort((a, b) => {
      if (a.isFactory !== b.isFactory) return a.isFactory ? -1 : 1;
      return (parseFloat(a.rim) || 0) - (parseFloat(b.rim) || 0);
    });

    return ok({ sizes });
  }

  return fail(`Unknown step "${step}"`, 400);
}
