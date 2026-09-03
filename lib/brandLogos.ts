/**
 * Maps Magento mgs_brand IDs → brand logo paths.
 *
 * Every path points into the local mirror of the Magento media tree at
 * /public/brands/mgs_brand/<x>/<y>/<file>, so brand artwork lives in exactly
 * one place and nothing is hotlinked to a remote domain.
 *
 * When a product carries `brand_logo_url` from GraphQL, prefer that — the
 * card components already do (`product.brandLogoUrl ?? getBrandLogo(...)`).
 */
export const BRAND_LOGOS: Record<number, string> = {
  // ── Top brands ──────────────────────────────────────────────────
  934: "/brands/mgs_brand/b/r/bride_1.png",                                 // Bridgestone
  886: "/brands/mgs_brand/m/i/michelin_1.png",                              // Michelin
  818: "/brands/mgs_brand/c/o/continental.png",                             // Continental
  817: "/brands/mgs_brand/g/o/goodyear_1_1_.png",                           // Goodyear
  899: "/brands/mgs_brand/p/i/pirelli_1.png",                               // Pirelli
  845: "/brands/mgs_brand/d/u/dunlop_1.png",                                // Dunlop
  861: "/brands/mgs_brand/h/a/hankok_1_1.png",                              // Hankook
  870: "/brands/mgs_brand/k/u/kumho-logo_1.png",                            // Kumho
  926: "/brands/mgs_brand/y/o/yokoma_1.png",                                // Yokohama
  916: "/brands/mgs_brand/t/o/toyo_1.png",                                  // Toyo
  848: "/brands/mgs_brand/f/a/falken_1.png",                                // Falken
  894: "/brands/mgs_brand/n/e/nexen_1_1.png",                               // Nexen
  906: "/brands/mgs_brand/r/o/roadstone_1.png",                             // Roadstone
  843: "/brands/mgs_brand/c/o/coperatie_1.png",                             // CooperTires (media file is named "coperatie")
  1900: "/brands/mgs_brand/s/a/sailun-logo_1.jpg",                          // Sailun

  // ── Mid-tier brands ─────────────────────────────────────────────
  826: "/brands/mgs_brand/a/c/accelera.png",                                // Accelera
  1530: "/brands/mgs_brand/d/o/double-coin_1.jpg",                          // Double Coin
  872: "/brands/mgs_brand/l/a/land-spider_1.jpg",                           // Landspider
  874: "/brands/mgs_brand/l/a/laufenn-logo.png",                            // Laufenn
  882: "/brands/mgs_brand/m/a/matrax-tyres-uae.png",                        // Matrax
  913: "/brands/mgs_brand/s/u/sunny_1.jpg",                                 // Sunny
  921: "/brands/mgs_brand/v/r/vredestein.jpg",                              // Vredestein
  3997: "/brands/mgs_brand/g/i/giti_1.jpg",                                 // Giti
  884: "/brands/mgs_brand/m/a/maxxis.png",                                  // Maxxis
  837: "/brands/mgs_brand/b/f/bfgoodrich_1.png",                            // BFGoodrich
  871: "/brands/mgs_brand/l/a/landsail-logo_1.jpg",                         // Landsail
  3525: "/brands/mgs_brand/a/r/arivo_1.jpg",                                // Arivo
  4509: "/brands/mgs_brand/a/r/arivo_1.jpg",                                // Arivo (alt id)
  927: "/brands/mgs_brand/z/e/zeetax_1.png",                                // Zeetex

  // ── Newly added / corrected brands from production website ──────────────────
  907: "/brands/mgs_brand/r/o/roadx-logo_1.png",                            // Roadx
  166: "/brands/mgs_brand/d/o/doublestar-tyres_1.jpg",                      // Double Star
  1531: "/brands/mgs_brand/d/o/doublestar-tyres_1.jpg",                     // Double Star (alt)
};

/**
 * Maps Magento brand attribute option IDs → brand names.
 */
export const BRAND_NAMES: Record<number, string> = {
  3183: "AC Delco",
  4799: "Alpha",
  2408: "American Racing",
  4800: "Anchee",
  1897: "Arduzza",
  4514: "Arisun",
  3525: "Arivo",
  4509: "Arivo",
  4062: "Arroyo",
  2409: "Asanti",
  3184: "Asimco",
  1553: "Atlander",
  2410: "ATX",
  4026: "Austone",
  2101: "Avon",
  2411: "Big Bull",
  4512: "Black Bear",
  2412: "Black Rhino",
  3185: "Bosch",
  4064: "Centara",
  4066: "Ceros",
  4511: "Comforser",
  1579: "Comoro",
  1898: "Compasal",
  3186: "Dagenite",
  4801: "Didar",
  3187: "Duracell",
  4508: "Dynamo",
  2413: "F-Power",
  4802: "Farroad",
  3188: "Fiamm",
  4513: "Firestone",
  1799: "Forceland",
  2414: "FR",
  4877: "Friezza",
  2415: "Fuel",
  2416: "G-FX",
  3526: "Galaxia",
  1941: "Gepormax",
  3997: "Giti",
  1567: "Grandstone",
  4803: "Greentrack",
  1943: "Grenlander",
  4063: "Imperial",
  4510: "Kenda",
  2417: "KMC Wheels",
  4241: "Krain",
  1546: "Kustone",
  2418: "Lenso",
  3528: "Linglong",
  1554: "Mileking",
  2102: "Mitas",
  2419: "Motegi Racing",
  2420: "Moto Metal",
  4518: "Nama",
  2421: "Niche",
  4110: "Otani",
  1906: "Petlas",
  4042: "Radar",
  4061: "Road King",
  4804: "Roadboss",
  1568: "Rockblade",
  2422: "Rotiform",
  1899: "Royal Black",
  3529: "Sahara",
  1900: "Sailun",
  4805: "Sava",
  3189: "Sebang",
  3190: "Solite",
  4806: "Sonar",
  4065: "Sonix",
  4807: "Sportrak",
  4808: "V-RICH",
  3191: "Varta",
  4242: "Venom",
  1548: "Vera",
  2423: "Vision",
  3192: "Volcan",
  2424: "Weld Off-Road",
  4809: "WIDEWAY",
  2425: "XD Wheels",
  4276: "YOMAR",
  3530: "Zelda",
  826: "Accelera",
  827: "Achilles",
  828: "Agate",
  932: "Alliance",
  829: "Altenzo",
  1458: "Annaite",
  933: "Apollo",
  830: "Aptany",
  1459: "Ardent",
  831: "Armstrong",
  834: "Atlas",
  835: "Atturo",
  836: "Bearway",
  837: "Bfgoodrich",
  1460: "BKT",
  838: "Blackarrow",
  839: "Blacklion",
  934: "Bridgestone",
  841: "Charmhoo",
  818: "Continental",
  843: "CooperTires",
  1462: "Davanti",
  844: "Deestone",
  1530: "Double Coin",
  1531: "Double Star",
  845: "Dunlop",
  1519: "Duraman",
  846: "Eternity",
  848: "Falken",
  849: "Firestone",
  1518: "Forceum",
  850: "Fortune",
  851: "Frztrac",
  935: "Fulda",
  1512: "Fullrun",
  852: "General Tire",
  853: "GO Pro",
  854: "GoForm",
  855: "Goodride",
  856: "Goodtrip",
  817: "Goodyear",
  857: "Greenmax",
  858: "Greentrac",
  859: "Gripmax",
  860: "Habilead",
  861: "Hankook",
  862: "Headway",
  863: "Hilo",
  864: "Honour",
  1463: "Horizon",
  865: "Ilink",
  866: "Infinity",
  1464: "J Planet",
  867: "Joyroad",
  868: "Kapsen",
  869: "Kenda Tires",
  1520: "King Boss",
  870: "Kumho",
  871: "Landsail",
  872: "Landspider",
  1465: "Lanvigator",
  873: "Lassa",
  874: "Laufenn",
  875: "Leao",
  877: "Long March",
  1507: "Longway",
  1467: "Malone",
  879: "Marshal",
  880: "Massimo",
  881: "Mastercraft",
  882: "Matrax",
  883: "Maxtrek",
  884: "Maxxis",
  1468: "Mayrun",
  885: "Metzeler",
  886: "Michelin",
  887: "Mickey Thompson",
  888: "Miletrip",
  889: "Minnell",
  891: "Montana",
  892: "Nankang",
  893: "Neupar",
  894: "Nexen",
  895: "Nitto",
  897: "Pallyking",
  898: "Pearly",
  899: "Pirelli",
  900: "Prinx",
  902: "Riken",
  903: "Roadcruza",
  904: "Roadking",
  905: "Roadmarch",
  906: "Roadstone",
  907: "Roadx",
  908: "Rotalla",
  1469: "Rydanz",
  909: "Sailwin",
  910: "Seam",
  936: "Shaheen",
  911: "Sportrak",
  912: "Sumitomo",
  913: "Sunny",
  914: "TBB Tires",
  1470: "Teraflex",
  1492: "Tesche",
  915: "Thunderer",
  916: "Toyo",
  917: "Tracmax",
  918: "Trazano",
  937: "Triangle",
  919: "Vitour",
  920: "Vizzoni",
  921: "Vredestein",
  922: "Wanli",
  923: "West Lake",
  924: "Windforce",
  925: "Winrun",
  926: "Yokohama",
  927: "Zeetex",
  928: "Zeta",
  929: "Zetum",
  930: "Zextour",
  931: "Zmax",
  1944: "Amaron",
  1945: "Rhino",
  4184: "Sensus",
  4254: "Prime Way",
  4283: "CST",
};

/**
 * Returns the logo URL for a given mgs_brand ID, or null if not mapped.
 * Accepts string or number — Magento returns numbers, Product type stores as string.
 */
/**
 * Brand name (normalised) → logo path.
 *
 * This store's `mgs_brand` attribute returns the brand NAME, not a numeric
 * option id, so a numeric-only lookup resolved to null for every product.
 * Built from BRAND_NAMES so the two maps can't drift apart.
 */
const LOGOS_BY_NAME: Record<string, string> = (() => {
  const index: Record<string, string> = {};
  for (const [id, name] of Object.entries(BRAND_NAMES)) {
    const logo = BRAND_LOGOS[Number(id)];
    if (logo) index[normaliseBrand(name)] ??= logo;
  }
  return index;
})();

function normaliseBrand(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Logo path for an mgs_brand value — accepts either a numeric option id or
 * a brand name, since which one Magento returns varies by store setup.
 */
export function getBrandLogo(brandId?: string | number | null): string | null {
  if (brandId == null || brandId === "") return null;

  const asNumber = Number(brandId);
  if (Number.isFinite(asNumber)) return BRAND_LOGOS[asNumber] ?? null;

  return LOGOS_BY_NAME[normaliseBrand(String(brandId))] ?? null;
}

/**
 * Returns the brand name for a given mgs_brand ID, or null if not mapped.
 */
export function getBrandName(brandId?: string | number | null): string | null {
  if (brandId == null || brandId === "") return null;
  return BRAND_NAMES[Number(brandId)] ?? null;
}

