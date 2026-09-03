import fs from "node:fs";
import path from "node:path";

/**
 * Resolves a brand logo out of the local mirror of Magento's mgs_brand media
 * tree (public/brands/mgs_brand/<x>/<y>/<file>).
 *
 * There is no brand→filename mapping anywhere — not in the API, not in a
 * config — so this derives it. Two properties of the media tree make that
 * possible:
 *
 *   1. Magento shards on the first two characters of the FILENAME, and a
 *      brand's logo file is normally named after the brand. So a brand's
 *      logo can only live in `<brand[0]>/<brand[1]>`. That one constraint
 *      removes almost all cross-brand confusion (without it "Roadx" matches
 *      "roadking", and "Sebang" matches "seam").
 *   2. Within that directory the filename is a near-spelling of the brand,
 *      even when it is misspelt — Bridgestone is stored as `bride_1.png`,
 *      Yokohama as `yokoma.png`, CooperTires as `coperatie.png`, Zeetex as
 *      `zeetax_1.png`. Similarity matching handles those; prefix matching
 *      does not.
 *
 * A brand with no confident match returns null and simply gets no tile —
 * nothing is guessed and no placeholder is substituted.
 */

const MEDIA_ROOT = path.join(process.cwd(), "public", "brands", "mgs_brand");
const PUBLIC_PREFIX = "/brands/mgs_brand";

/** Storefront photography and campaign art, not logos. */
const PHOTO = /(shop|banner|dubai|abudhabi|service|point|online|_we_)/;

/** Words that decorate a filename or brand label without identifying it. */
const DECOR = /(logo|tyres?|tires?|wheels?|uae|batteries|battery|bike)/g;

const MIN_SCORE = 0.6;

export type BrandLogoMatch = {
  /** Public path, e.g. /brands/mgs_brand/b/r/bride_1.png */
  logo: string;
  /** Match confidence, for logging/diagnostics. */
  score: number;
};

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Filename reduced to its identifying part: variant suffixes and decorative words dropped. */
function fileCore(stem: string): string {
  const withoutVariant = stem.toLowerCase().replace(/([_-]+\d+)+$/, "");
  return normalise(withoutVariant.replace(DECOR, ""));
}

/** The forms of a brand label worth comparing against a filename. */
function brandForms(label: string): string[] {
  const forms = new Set([
    normalise(label),
    normalise(label.toLowerCase().replace(DECOR, "")),
    normalise(label.split(/\s+/)[0] ?? ""),
  ]);
  forms.delete("");
  return [...forms];
}

function commonPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
}

/** Levenshtein edit distance. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(
        prev[j] + 1, // deletion
        row[j - 1] + 1, // insertion
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), // substitution
      );
    }
    prev = row;
  }

  return prev[b.length];
}

/**
 * How alike two names are, 0–1.
 *
 * Two signals, because neither alone covers the real filenames:
 *   • edit distance catches a scrambled spelling of similar length —
 *     `coopertires` / `coperatie` (prefix is only "co").
 *   • prefix over the SHORTER name catches a truncation —
 *     `bridgestone` / `bride` (edit distance is poor, prefix is 4 of 5).
 * Taking the max lets each cover the other's blind spot, while
 * `sebang` / `seam` stays below threshold on both.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const byDistance = 1 - editDistance(a, b) / Math.max(a.length, b.length);

  // A prefix only means something if it's several characters long —
  // otherwise a two-letter filename stem would score 1.0 against anything
  // starting with those two letters.
  const prefix = commonPrefix(a, b);
  const byPrefix = prefix >= 4 ? prefix / Math.min(a.length, b.length) : 0;

  return Math.max(byDistance, byPrefix);
}

type Candidate = { publicPath: string; stem: string; core: string; size: number };

let cache: Map<string, Candidate[]> | null = null;

/** Index the media tree once per server process, grouped by shard directory. */
function candidatesByShard(): Map<string, Candidate[]> {
  if (cache) return cache;

  const index = new Map<string, Candidate[]>();
  let shards: string[];
  try {
    shards = fs.readdirSync(MEDIA_ROOT);
  } catch {
    cache = index;
    return index;
  }

  for (const first of shards) {
    const firstDir = path.join(MEDIA_ROOT, first);
    if (!fs.statSync(firstDir).isDirectory()) continue;

    for (const second of fs.readdirSync(firstDir)) {
      const secondDir = path.join(firstDir, second);
      if (!fs.statSync(secondDir).isDirectory()) continue;

      const entries: Candidate[] = [];
      for (const file of fs.readdirSync(secondDir)) {
        if (!/\.(png|jpe?g|webp|svg|gif)$/i.test(file)) continue;
        const stem = file.replace(/\.[^.]+$/, "");
        const core = fileCore(stem);
        // Too short to identify a brand — e.g. `fr-wheels` reduces to "fr".
        if (core.length < 3) continue;
        entries.push({
          publicPath: `${PUBLIC_PREFIX}/${first}/${second}/${file}`,
          stem,
          core,
          size: fs.statSync(path.join(secondDir, file)).size,
        });
      }
      if (entries.length) index.set(`${first}/${second}`, entries);
    }
  }

  cache = index;
  return index;
}

/** Best logo in the media tree for this brand label, or null if none is confident enough. */
export function findBrandLogo(label: string): BrandLogoMatch | null {
  const key = normalise(label);
  if (key.length < 2) return null;

  const candidates = candidatesByShard().get(`${key[0]}/${key[1]}`);
  if (!candidates?.length) return null;

  const forms = brandForms(label);
  let best: BrandLogoMatch | null = null;

  for (const candidate of candidates) {
    const raw = Math.max(...forms.map((f) => similarity(f, candidate.core)));
    const prefix = Math.max(...forms.map((f) => commonPrefix(f, candidate.core)));

    // Either the names share a real prefix, or they're close enough overall.
    // Both gates are needed: prefix alone misses `coperatie`, similarity
    // alone lets `seam` stand in for Sebang.
    if (prefix < 4 && raw < 0.78) continue;

    const stem = candidate.stem.toLowerCase();
    let score = raw;
    if (stem.includes("logo")) score += 0.1;
    if (PHOTO.test(stem)) score -= 0.55;
    // Nudge toward the lighter of two otherwise equal files.
    score -= Math.min(candidate.size, 2_000_000) / 60_000_000;

    if (score >= MIN_SCORE && (!best || score > best.score)) {
      best = { logo: candidate.publicPath, score };
    }
  }

  return best;
}

/** Returns all unique brand logos discovered in public/brands/mgs_brand */
export function listDiscoveredBrandLogos(): { name: string; filterValue: string; logo: string; count: number }[] {
  const shards = candidatesByShard();
  const seen = new Set<string>();
  const results: { name: string; filterValue: string; logo: string; count: number }[] = [];

  for (const [, candidates] of shards.entries()) {
    for (const c of candidates) {
      if (PHOTO.test(c.stem)) continue;
      const cleanName = c.core.charAt(0).toUpperCase() + c.core.slice(1);
      if (cleanName.length < 3 || seen.has(cleanName.toLowerCase())) continue;
      seen.add(cleanName.toLowerCase());
      results.push({
        name: cleanName,
        filterValue: cleanName,
        logo: c.publicPath,
        count: 1,
      });
    }
  }
  return results;
}
