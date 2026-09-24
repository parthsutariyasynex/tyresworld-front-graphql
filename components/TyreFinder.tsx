"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Search,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  ArrowUpDown,
  CircleDot,
  Check,
  Plus,
  Car,
  Layers,
  Calendar,
  Gauge,
} from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";
import { buildFilterParams, buildTyreSizeSlug } from "@/lib/filterBuilder";
import { APP_CONFIG } from "@/src/config/app-config";
import TyreSizeVisualizer from "@/components/TyreSizeVisualizer";

/* ── types ───────────────────────────────────────────────────────── */
type AttrOption = {
  label: string;
  value: string;
  fuel?: string | null;
  hp?: number | null;
  logo?: string;
};
/** A fitment size for the selected trim, from /api/tyre-finder/vehicle?step=sizes. */
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
type Aggs = Record<string, AttrOption[]>;
type Tab = "size" | "vehicle";
type SizeStep = "width" | "height" | "rim" | "summary";
type VehStep = "vehicle" | "model" | "year" | "engine" | "size" | "summary";

interface TyreFinderProps {
  locale?: string;
  categoryUid?: string;
  basePath?: string;
  disableSticky?: boolean;
  sizeOnly?: boolean;
}

const SIZE_FIELDS = [
  "width",
  "height",
  "haight",
  "rim",
  "width_rear",
  "rear_width",
  "haight_rear",
  "height_rear",
  "rear_height",
  "rim_rear",
  "rear_rim",
] as const;

/** Purely numeric label, e.g. "225" or "22.5" — but not "31X" or "15C". */
const NUMERIC_LABEL = /^\d+(\.\d+)?$/;

function sortSizeOpts(opts: AttrOption[]): AttrOption[] {
  return [...opts].sort((a, b) => {
    if (a.label.toLowerCase() === "none") return 1;
    if (b.label.toLowerCase() === "none") return -1;
    const aNum = NUMERIC_LABEL.test(a.label), bNum = NUMERIC_LABEL.test(b.label);
    if (aNum && bNum) return parseFloat(a.label) - parseFloat(b.label);
    /* Suffixed labels (31X, 15C) sort after the plain numbers, matching the
       live finder. parseFloat can't decide it — parseFloat("31X") is 31, which
       would put it ahead of 155. */
    if (aNum !== bNum) return aNum ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

/* Vehicle-make logos: this store's own real logo set (downloaded once from
   Magento's static theme folder — the same assets the live site itself
   uses — into public/vehicle-logos/, since that origin sits behind
   Cloudflare/Basic Auth and can't be fetched live from the browser or from
   Vercel's serverless functions). No external hosts (raw.githubusercontent,
   wheel-api.klever.ae) — a make with no local file just shows the generic
   car icon below, an honest empty state instead of a third-party guess. */
function getVehicleLogo(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `/vehicle-logos/${slug}.png`;
}

function VehicleLogo({ label, logoUrl }: { label: string; logoUrl?: string }) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const primaryUrl = logoUrl || `/vehicle-logos/${slug}.png`;
  const fallbackUrl = `/vehicle-logos/${slug}.png`;

  const [currentSrc, setCurrentSrc] = useState(primaryUrl);
  const [attempt, setAttempt] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleError = () => {
    if (attempt === 0 && currentSrc !== fallbackUrl) {
      setAttempt(1);
      setCurrentSrc(fallbackUrl);
    } else {
      setIsError(true);
      setIsLoaded(true);
    }
  };

  return (
    <div className="relative h-9 w-full flex items-center justify-center overflow-hidden">
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/loader-style1.svg"
            alt="Loading"
            width={20}
            height={20}
            className="opacity-70 animate-spin"
          />
        </div>
      )}

      {isError ? (
        <div className="flex items-center justify-center text-gray-400">
          <Car size={24} strokeWidth={1.75} />
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={currentSrc}
          alt={label}
          loading="lazy"
          className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
export default function TyreFinder({ locale: localeProp, categoryUid, basePath, disableSticky, sizeOnly }: TyreFinderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = localeProp ?? (pathname.split("/")[1] === "ar" ? "ar" : "en");
  const tyresBase = `/${locale}/tyres`;

  /* ── vehicle / model / year metadata from customAttributeMetadataV2 ─ */
  const [meta, setMeta] = useState<Record<string, AttrOption[]>>({});
  const [metaLoading, setMetaLoad] = useState(true);

  /* ── width options from real product data ──────────────────────── */
  const [widths, setWidths] = useState<AttrOption[]>([]);
  const [widthLoading, setWidthLoad] = useState(true);

  const isMotorcyclePage = pathname.includes("motorcycle") || pathname.includes("motorbike");
  const effectiveCategoryUid =
    categoryUid ?? (isMotorcyclePage ? APP_CONFIG.magento.motorcycleCategoryUid : undefined);
  const isSizeOnly = Boolean(sizeOnly || isMotorcyclePage);
  // The root "Tyres" category's own uid (passed down on every /tyres page
  // once its category data loads) isn't a real scope — only a genuinely
  // different category (e.g. motorcycle) should keep the query-string
  // fallback instead of the canonical size-slug URL.
  const isScopedCategory =
    !!effectiveCategoryUid && effectiveCategoryUid !== APP_CONFIG.magento.tyresCategoryUid;

  /* ── category param included in every size request ─────────────── */
  const catParam: Record<string, string> = effectiveCategoryUid ? { category_uid: effectiveCategoryUid } : {};

  /* ── selections ────────────────────────────────────────────────── */
  const [selWidth, setSelWidth] = useState("");
  const [selHeight, setSelHeight] = useState("");
  const [selRim, setSelRim] = useState("");
  const [hasRearTyre, setHasRearTyre] = useState(false);
  const [activeSizeTab, setActiveSizeTab] = useState<"front" | "rear">("front");
  const [selRearWidth, setSelRearWidth] = useState("");
  const [selRearHeight, setSelRearHeight] = useState("");
  const [selRearRim, setSelRearRim] = useState("");
  const [selVehicle, setSelVehicle] = useState("");
  const [selModel, setSelModel] = useState("");
  const [selYear, setSelYear] = useState("");
  const [selEngine, setSelEngine] = useState("");
  /* The trim's fitment sizes, and the one picked — this is what actually
     filters Magento, since no product carries vehicle/model/year data. */
  const [vehSizes, setVehSizes] = useState<TyreSize[] | null>(null);
  const [selSize, setSelSize] = useState<TyreSize | null>(null);

  /* ── dependent child options ───────────────────────────────────── */
  const [childHeights, setChildHeights] = useState<AttrOption[] | null>(null);
  const [childRims, setChildRims] = useState<AttrOption[] | null>(null);
  const [childRearHeights, setChildRearHeights] = useState<AttrOption[] | null>(null);
  const [childRearRims, setChildRearRims] = useState<AttrOption[] | null>(null);
  const [childModels, setChildModels] = useState<AttrOption[] | null>(null);
  const [childYears, setChildYears] = useState<AttrOption[] | null>(null);
  const [childEngines, setChildEngines] = useState<AttrOption[] | null>(null);
  const [depLoading, setDepLoading] = useState(false);

  /* ── UI state ──────────────────────────────────────────────────── */
  const [tab, setTab] = useState<Tab>("size");
  const [sizeOpen, setSizeOpen] = useState(false);
  const [sizeStep, setSizeStep] = useState<SizeStep>("width");
  const [sizeQuery, setSizeQuery] = useState("");
  const [vehOpen, setVehOpen] = useState(false);
  const [vehStep, setVehStep] = useState<VehStep>("vehicle");
  const [vehQuery, setVehQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (disableSticky) {
      setIsSticky(false);
      return;
    }
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, disableSticky]);

  const sizeAbortRef = useRef<AbortController | null>(null);
  const vehAbortRef = useRef<AbortController | null>(null);

  useScrollLock(sizeOpen || vehOpen);

  /* ── reset selections on pathname change ──────────────────────── */
  useEffect(() => {
    setSelWidth("");
    setSelHeight("");
    setSelRim("");
    setHasRearTyre(false);
    setActiveSizeTab("front");
    setSelRearWidth("");
    setSelRearHeight("");
    setSelRearRim("");
    setSelVehicle("");
    setSelModel("");
    setSelYear("");
    setSelEngine("");
    setSizeStep("width");
    setVehStep("vehicle");
    setVehQuery("");
    setChildHeights(null);
    setChildRims(null);
    setChildRearHeights(null);
    setChildRearRims(null);
    setChildModels(null);
    setChildYears(null);
    setChildEngines(null);
    setSelSize(null);
    setVehSizes(null);
  }, [pathname]);

  /* ── load width / height / rim option lists ────────────────────── */
  useEffect(() => {
    const endpoint = effectiveCategoryUid
      ? `/api/tyre-finder?category_uid=${encodeURIComponent(effectiveCategoryUid)}`
      : "/api/tyre-finder";
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, AttrOption[]> = {};
        for (const attr of d.attributes ?? []) {
          /* vehicle/model/year are Magento attributes the vehicle tab no
             longer reads — it uses the partsfinder cascade below. */
          if (attr.attribute_code === "vehicle" || attr.attribute_code === "model" || attr.attribute_code === "year") continue;
          map[attr.attribute_code] = (attr.attribute_options ?? []).filter(
            (o: AttrOption) => o.label && (attr.attribute_code === "height" || o.label.toLowerCase() !== "none")
          );
        }
        setMeta((prev) => ({ ...prev, ...map }));
        setWidths(sortSizeOpts(map.width ?? []));
        setWidthLoad(false);
      })
      .catch(() => setWidthLoad(false));
  }, [effectiveCategoryUid]);

  /* ── load vehicle makes from the partsfinder cascade ───────────── */
  useEffect(() => {
    setMetaLoad(true);
    fetchVehStep({ step: "makes" })
      .then((opts) => {
        setMeta((prev) => ({ ...prev, vehicle: opts }));
        setMetaLoad(false);
      })
      .catch((e) => { if (e.name !== "AbortError") setMetaLoad(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── fetch size options from products.aggregations ─────────────── */
  const fetchSizeAggs = useCallback(
    async (params: Record<string, string>): Promise<Aggs> => {
      sizeAbortRef.current?.abort();
      const ctrl = new AbortController();
      sizeAbortRef.current = ctrl;
      const qs = new URLSearchParams(params).toString();
      const r = await fetch(`/api/tyre-finder/options?${qs}`, { signal: ctrl.signal });
      const d = await r.json();
      return d.aggregations ?? {};
    },
    []
  );

  /* ── fetch a vehicle cascade step from the partsfinder route ────── */
  const fetchVehStep = useCallback(
    async (params: Record<string, string>): Promise<AttrOption[]> => {
      vehAbortRef.current?.abort();
      const ctrl = new AbortController();
      vehAbortRef.current = ctrl;
      const qs = new URLSearchParams({ ...params, store: locale }).toString();
      const r = await fetch(`/api/tyre-finder/vehicle?${qs}`, { signal: ctrl.signal });
      const d = await r.json();
      return d.options ?? [];
    },
    [locale]
  );

  /* Fitment sizes for the selected trim — a different response shape, so it
     doesn't share fetchVehStep. */
  const fetchVehSizes = useCallback(
    async (params: Record<string, string>): Promise<TyreSize[]> => {
      vehAbortRef.current?.abort();
      const ctrl = new AbortController();
      vehAbortRef.current = ctrl;
      const qs = new URLSearchParams({ ...params, step: "sizes", store: locale }).toString();
      const r = await fetch(`/api/tyre-finder/vehicle?${qs}`, { signal: ctrl.signal });
      const d = await r.json();
      return d.sizes ?? [];
    },
    [locale]
  );

  /* ── FRONT: width selected → fetch dependent available heights ─── */
  useEffect(() => {
    if (!selWidth) {
      setChildHeights(null);
      setSelHeight("");
      setChildRims(null);
      setSelRim("");
      return;
    }
    setDepLoading(true);
    fetchSizeAggs({ width: selWidth, ...catParam })
      .then((aggs) => {
        setChildHeights(aggs.height ? sortSizeOpts(aggs.height) : []);
        setDepLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setDepLoading(false);
      });
  }, [selWidth, fetchSizeAggs]);

  /* ── FRONT: width + height selected → fetch dependent available rims ─ */
  useEffect(() => {
    if (!selWidth || !selHeight) {
      setChildRims(null);
      setSelRim("");
      return;
    }
    setDepLoading(true);
    fetchSizeAggs({ width: selWidth, height: selHeight, ...catParam })
      .then((aggs) => {
        setChildRims(aggs.rim ? sortSizeOpts(aggs.rim) : []);
        setDepLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setDepLoading(false);
      });
  }, [selWidth, selHeight, fetchSizeAggs]);

  /* ── REAR: width selected → fetch dependent available rear heights ── */
  useEffect(() => {
    if (!selRearWidth) {
      setChildRearHeights(null);
      setSelRearHeight("");
      setChildRearRims(null);
      setSelRearRim("");
      return;
    }
    setDepLoading(true);
    fetchSizeAggs({ width: selRearWidth, ...catParam })
      .then((aggs) => {
        setChildRearHeights(aggs.height ? sortSizeOpts(aggs.height) : []);
        setDepLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setDepLoading(false);
      });
  }, [selRearWidth, fetchSizeAggs]);

  /* ── REAR: width + height selected → fetch dependent available rear rims ─ */
  useEffect(() => {
    if (!selRearWidth || !selRearHeight) {
      setChildRearRims(null);
      setSelRearRim("");
      return;
    }
    setDepLoading(true);
    fetchSizeAggs({ width: selRearWidth, height: selRearHeight, ...catParam })
      .then((aggs) => {
        setChildRearRims(aggs.rim ? sortSizeOpts(aggs.rim) : []);
        setDepLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setDepLoading(false);
      });
  }, [selRearWidth, selRearHeight, fetchSizeAggs]);

  /* ── make selected → fetch models ──────────────────────────────── */
  useEffect(() => {
    if (!selVehicle) {
      setChildModels(null); setSelModel("");
      setChildYears(null); setSelYear("");
      return;
    }
    setDepLoading(true);
    fetchVehStep({ step: "models", make: selVehicle })
      .then((opts) => { setChildModels(opts); setDepLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
  }, [selVehicle, fetchVehStep]);

  /* ── make + model selected → fetch years ────────────────────────── */
  useEffect(() => {
    if (!selVehicle || !selModel) {
      setChildYears(null); setSelYear("");
      setChildEngines(null); setSelEngine("");
      return;
    }
    setDepLoading(true);
    fetchVehStep({ step: "years", make: selVehicle, model: selModel })
      .then((opts) => { setChildYears(opts); setDepLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
  }, [selVehicle, selModel, fetchVehStep]);

  /* ── make + model + year selected → fetch engine trims ──────────── */
  useEffect(() => {
    if (!selVehicle || !selModel || !selYear) {
      setChildEngines(null); setSelEngine("");
      return;
    }
    setDepLoading(true);
    fetchVehStep({ step: "trims", make: selVehicle, model: selModel, year: selYear })
      .then((opts) => {
        setChildEngines(opts);
        if (opts.length > 0 && !selEngine) {
          setSelEngine(opts[0].value);
        }
        setDepLoading(false);
      })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
  }, [selVehicle, selModel, selYear, fetchVehStep]);

  /* ── trim selected → fetch the tyre sizes that fit it ───────────── */
  useEffect(() => {
    if (!selVehicle || !selModel || !selYear || !selEngine) {
      setVehSizes(null); setSelSize(null);
      return;
    }
    setDepLoading(true);
    fetchVehSizes({
      make: selVehicle,
      model: selModel,
      year: selYear,
      modification: selEngine,
    })
      .then((sizes) => { setVehSizes(sizes); setDepLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
  }, [selVehicle, selModel, selYear, selEngine, fetchVehSizes]);

  /* ── displayed lists ───────────────────────────────────────────── */
  const displayHeights =
    activeSizeTab === "front"
      ? ((childHeights && childHeights.length > 0) ? childHeights : (meta.height ? sortSizeOpts(meta.height) : []))
      : ((childRearHeights && childRearHeights.length > 0) ? childRearHeights : (meta.height ? sortSizeOpts(meta.height) : []));

  const displayRims =
    activeSizeTab === "front"
      ? ((childRims && childRims.length > 0) ? childRims : (meta.rim ? sortSizeOpts(meta.rim) : []))
      : ((childRearRims && childRearRims.length > 0) ? childRearRims : (meta.rim ? sortSizeOpts(meta.rim) : []));

  /* Model/year/trim come only from the partsfinder cascade. Magento's own
     `model` attribute has no options and its `year` is the tyre's production
     year, so neither is a valid fallback here. */
  const displayModels = childModels ?? [];
  const displayYears = childYears ?? [];
  const displayEngines = childEngines ?? [];
  const displaySizes = vehSizes ?? [];

  /* ── label lookup ──────────────────────────────────────────────── */
  const labelFor = (code: string, value: string): string => {
    let source: AttrOption[];
    if (code === "width") source = meta.width ?? widths;
    else if (code === "height")
      source =
        activeSizeTab === "rear"
          ? (childRearHeights ?? meta.height ?? [])
          : (childHeights ?? meta.height ?? []);
    else if (code === "rim")
      source =
        activeSizeTab === "rear"
          ? (childRearRims ?? meta.rim ?? [])
          : (childRims ?? meta.rim ?? []);
    else if (code === "engine") source = childEngines ?? [];
    else if (code === "model") source = childModels ?? [];
    else if (code === "year") source = childYears ?? [];
    else if (code === "vehicle") source = meta.vehicle ?? [];
    else source = meta[code] ?? [];
    return source.find((o) => o.value === value)?.label ?? value;
  };

  /* ── navigation ────────────────────────────────────────────────── */
  const appendCategory = (p: URLSearchParams) => {
    if (categoryUid) p.set("category_uid", categoryUid);
    return p;
  };

  const handleSizeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selWidth && !selHeight && !selRim) return;
    const dest = basePath ?? tyresBase;
    const filterObj: Record<string, string> = {
      width: selWidth,
      height: selHeight,
      rim: selRim,
    };
    if (hasRearTyre && selRearWidth && selRearHeight && selRearRim) {
      filterObj.rear_width = selRearWidth;
      filterObj.rear_height = selRearHeight;
      filterObj.rear_rim = selRearRim;
    }
    // Plain, unscoped tyres search → the canonical SEO size URL. A
    // brand/category-scoped instance (basePath or effectiveCategoryUid set)
    // keeps the existing query-string behavior — no slug route exists for
    // those scoped contexts.
    if (!isScopedCategory) {
      router.push(buildTyreSizeSlug(filterObj));
    } else {
      router.push(
        `${dest}?${appendCategory(buildFilterParams(filterObj, [...SIZE_FIELDS]))}`
      );
    }
  };

  const handleVehicleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selSize) return;
    const dest = basePath ?? tyresBase;
    const filterObj: Record<string, string> = {
      width: selSize.width,
      height: selSize.height,
      rim: selSize.rim,
    };
    if (selSize.rear) {
      filterObj.rear_width = selSize.rear.width;
      filterObj.rear_height = selSize.rear.height;
      filterObj.rear_rim = selSize.rear.rim;
    }
    if (!isScopedCategory) {
      router.push(buildTyreSizeSlug(filterObj));
    } else {
      router.push(
        `${dest}?${appendCategory(
          buildFilterParams(filterObj, [...SIZE_FIELDS])
        )}`
      );
    }
  };

  /* ── size modal helpers ────────────────────────────────────────── */
  const openSize = () => {
    setSelWidth("");
    setSelHeight("");
    setSelRim("");
    setHasRearTyre(false);
    setSelRearWidth("");
    setSelRearHeight("");
    setSelRearRim("");
    setChildHeights(null);
    setChildRims(null);
    setChildRearHeights(null);
    setChildRearRims(null);
    setSizeStep("width");
    setActiveSizeTab("front");
    setSizeQuery("");
    setSizeOpen(true);
  };

  useEffect(() => {
    setSizeQuery("");
  }, [sizeStep, activeSizeTab]);

  const pickWidth = (v: string) => {
    if (activeSizeTab === "front") {
      setSelWidth(v);
      setSizeStep("height");
    } else {
      setSelRearWidth(v);
      setSizeStep("height");
    }
  };

  const pickHeight = (v: string) => {
    if (activeSizeTab === "front") {
      setSelHeight(v);
      setSizeStep("rim");
    } else {
      setSelRearHeight(v);
      setSizeStep("rim");
    }
  };

  const pickRim = (v: string) => {
    if (activeSizeTab === "front") {
      setSelRim(v);
      if (hasRearTyre && (!selRearWidth || !selRearHeight || !selRearRim)) {
        setActiveSizeTab("rear");
        setSizeStep("width");
      } else {
        setSizeStep("summary");
      }
    } else {
      setSelRearRim(v);
      setSizeStep("summary");
    }
  };

  const handleBackOrCancel = () => {
    if (sizeStep === "summary") {
      if (hasRearTyre && selRearWidth) {
        setActiveSizeTab("rear");
        setSizeStep("rim");
      } else {
        setActiveSizeTab("front");
        setSizeStep("rim");
      }
    } else if (sizeStep === "rim") {
      if (activeSizeTab === "rear") {
        setSelRearRim("");
      } else {
        setSelRim("");
      }
      setSizeStep("height");
    } else if (sizeStep === "height") {
      if (activeSizeTab === "rear") {
        setSelRearHeight("");
      } else {
        setSelHeight("");
      }
      setSizeStep("width");
    } else if (sizeStep === "width") {
      if (activeSizeTab === "rear") {
        setHasRearTyre(false);
        setSelRearWidth("");
        setSelRearHeight("");
        setSelRearRim("");
        setChildRearHeights(null);
        setChildRearRims(null);
        setActiveSizeTab("front");
        setSizeStep("summary");
      } else {
        closeSize();
      }
    }
  };

  const handleNextStep = () => {
    const curW = activeSizeTab === "front" ? selWidth : selRearWidth;
    const curH = activeSizeTab === "front" ? selHeight : selRearHeight;
    const curR = activeSizeTab === "front" ? selRim : selRearRim;

    if (sizeStep === "width" && curW) {
      setSizeStep("height");
    } else if (sizeStep === "height" && curH) {
      setSizeStep("rim");
    } else if (sizeStep === "rim" && curR) {
      if (
        hasRearTyre &&
        activeSizeTab === "front" &&
        (!selRearWidth || !selRearHeight || !selRearRim)
      ) {
        setActiveSizeTab("rear");
        setSizeStep("width");
      } else {
        setSizeStep("summary");
      }
    }
  };

  const toggleRearMode = () => {
    if (hasRearTyre) {
      setHasRearTyre(false);
      setSelRearWidth("");
      setSelRearHeight("");
      setSelRearRim("");
      setActiveSizeTab("front");
    } else {
      setHasRearTyre(true);
      setActiveSizeTab("rear");
      setSizeStep("width");
    }
  };

  const closeSize = () => {
    setSizeOpen(false);
    setSizeStep("width");
    setActiveSizeTab("front");
    setSizeQuery("");
    setSelWidth("");
    setSelHeight("");
    setSelRim("");
    setHasRearTyre(false);
    setSelRearWidth("");
    setSelRearHeight("");
    setSelRearRim("");
    setChildHeights(null);
    setChildRims(null);
    setChildRearHeights(null);
    setChildRearRims(null);
  };

  /* ── vehicle modal helpers ─────────────────────────────────────── */
  const openVeh = () => {
    setSelVehicle("");
    setSelModel("");
    setSelYear("");
    setSelEngine("");
    setSelSize(null);
    setChildModels(null);
    setChildYears(null);
    setChildEngines(null);
    setVehSizes(null);
    setVehStep("vehicle");
    setVehQuery("");
    setVehOpen(true);
  };

  const pickVehicle = (v: string) => {
    setSelVehicle(v);
    setSelModel("");
    setSelYear("");
    setSelEngine("");
    setVehQuery("");
    setVehStep("model");
  };
  const pickModel = (v: string) => {
    setSelModel(v);
    setSelYear("");
    setSelEngine("");
    setVehQuery("");
    setVehStep("year");
  };
  const pickYear = (v: string) => {
    setSelYear(v);
    setSelEngine("");
    setVehQuery("");
    setVehStep("engine");
  };
  const pickEngine = (v: string) => {
    setSelEngine(v);
    setVehQuery("");
    setVehStep("engine");
  };
  const pickSize = (s: TyreSize) => {
    setSelSize(s);
    setVehQuery("");
    const dest = basePath ?? tyresBase;
    const filterObj: Record<string, string> = {
      width: s.width,
      height: s.height,
      rim: s.rim,
    };
    if (s.rear) {
      filterObj.rear_width = s.rear.width;
      filterObj.rear_height = s.rear.height;
      filterObj.rear_rim = s.rear.rim;
    }
    if (!isScopedCategory) {
      router.push(buildTyreSizeSlug(filterObj));
    } else {
      router.push(
        `${dest}?${appendCategory(
          buildFilterParams(filterObj, [...SIZE_FIELDS])
        )}`
      );
    }
    closeVeh();
  };

  const handleVehNext = () => {
    if (vehStep === "vehicle" && selVehicle) setVehStep("model");
    else if (vehStep === "model" && selModel) setVehStep("year");
    else if (vehStep === "year" && selYear) setVehStep("engine");
  };

  const handleVehBack = () => {
    if (vehStep === "engine") {
      setSelEngine("");
      setVehSizes(null);
      setSelSize(null);
      setVehStep("year");
    } else if (vehStep === "year") {
      setSelYear("");
      setVehStep("model");
    } else if (vehStep === "model") {
      setSelVehicle("");
      setVehStep("vehicle");
    } else {
      closeVeh();
    }
  };

  const closeVeh = () => {
    setVehOpen(false);
    setSelVehicle("");
    setSelModel("");
    setSelYear("");
    setSelEngine("");
    setSelSize(null);
    setVehQuery("");
    setVehStep("vehicle");
    setChildModels(null);
    setChildYears(null);
    setChildEngines(null);
    setVehSizes(null);
  };

  const vehFilter = (opts: AttrOption[]) =>
    vehQuery ? opts.filter((o) => o.label.toLowerCase().includes(vehQuery.toLowerCase())) : opts;

  /* ── shared styles ─────────────────────────────────────────────── */
  const fieldBtn =
    "w-full bg-transparent text-black font-normal text-[13px] outline-none cursor-pointer flex items-center justify-between";
  const optBtn = (active: boolean) =>
    `border py-3.5 rounded-lg text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${active
      ? "bg-black text-white border-black"
      : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"
    }`;

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div
      className={`tyre-search-sticky-wrapper ${disableSticky ? "disable-sticky static-finder" : ""}`}
      style={!disableSticky && isSticky ? {} : undefined}
    >
      <section
        id="search"
        className={`search-wrap tyreform ${!disableSticky && isSticky ? "sticky" : ""} ${disableSticky ? "disable-sticky static-finder" : ""}`}
      >
        <form onSubmit={tab === "vehicle" ? handleVehicleSearch : handleSizeSearch}>
          <div className="main-search">
            <div className="search-tabs">

              {/* Tab pills */}
              <div className="nav nav-tabs justify-content-center" role="tablist">
                {(
                  isSizeOnly
                    ? [{ id: "size", label: "Search Tyre Size" }]
                    : [
                        { id: "size", label: "Search Tyre Size" },
                        { id: "vehicle", label: "Search By Vehicle" },
                      ]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id as Tab)}
                    className={`button ${tab === t.id ? "active" : ""}`}
                  >
                    <a>{t.label}</a>
                  </button>
                ))}
              </div>

              {/* Field row */}
              <div className="tab-content">
                <div className="tab-inner">

                  {/* ── Size tab ──────────────────────────────── */}
                  {tab === "size" && (
                    <div className="search-wrap-inner">
                      <ul className="list-none selection-list">
                        <li>
                          <button
                            type="button"
                            onClick={() => openSize()}
                            className="selection-item"
                          >
                            <span>Width</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => openSize()}
                            className="selection-item"
                          >
                            <span>Height</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => openSize()}
                            className="selection-item"
                          >
                            <span>Rim</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* ── Vehicle tab ────────────────────────────── */}
                  {tab === "vehicle" && (
                    <div className="search-wrap-inner">
                      <ul className="list-none selection-list">
                        <li>
                          <button
                            type="button"
                            onClick={() => openVeh()}
                            className="selection-item"
                          >
                            <span>Make</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => openVeh()}
                            className="selection-item"
                          >
                            <span>Model</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => openVeh()}
                            className="selection-item"
                          >
                            <span>Year</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                      </ul>

                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SIZE MODAL / VEHICLE MODAL (Portaled to body)
      ════════════════════════════════════════════════════════════ */}
      {mounted && typeof document !== "undefined" && createPortal(
        <>
          {sizeOpen && (() => {
            const currWidth = activeSizeTab === "front" ? selWidth : selRearWidth;
            const currHeight = activeSizeTab === "front" ? selHeight : selRearHeight;
            const currRim = activeSizeTab === "front" ? selRim : selRearRim;
            const currVal = sizeStep === "width" ? currWidth : sizeStep === "height" ? currHeight : sizeStep === "rim" ? currRim : "";

            const frontFormatted = `${selWidth ? labelFor("width", selWidth) : "—"} / ${selHeight ? labelFor("height", selHeight) : "—"} R${selRim ? labelFor("rim", selRim) : "—"}`;
            const rearFormatted = `${selRearWidth ? labelFor("width", selRearWidth) : "—"} / ${selRearHeight ? labelFor("height", selRearHeight) : "—"} R${selRearRim ? labelFor("rim", selRearRim) : "—"}`;

            const currentOptions =
              sizeStep === "width"
                ? widths
                : sizeStep === "height"
                ? displayHeights
                : sizeStep === "rim"
                ? displayRims
                : [];

            const filteredOptions = currentOptions.filter((o) =>
              o.label.toLowerCase().includes(sizeQuery.toLowerCase())
            );

                const stepNumber = sizeStep === "width" ? 1 : sizeStep === "height" ? 2 : 3;
            const progressPct = sizeStep === "width" ? 33 : sizeStep === "height" ? 66 : 100;

            return (
              <div
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
                onClick={closeSize}
              >
                <div
                  className="relative w-full max-w-[920px] h-[660px] sm:h-[680px] max-h-[94vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Select your tyre size"
                >
                  {/* ── TOP HEADER (REDESIGNED) ── */}
                  <div className="relative shrink-0 overflow-hidden" style={{ background: "linear-gradient(135deg,#0d1117 0%,#111827 60%,#1a0a0c 100%)" }}>
                    {/* Ambient red glow behind content */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 120% at 20% 50%,rgba(237,28,36,0.18) 0%,transparent 70%)" }} />
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "linear-gradient(to bottom,#ed1c24,#8f0d13)" }} />

                    <div className="pl-6 pr-5 sm:pr-7 pt-4 pb-3.5">
                      <div className="flex items-start justify-between gap-3">

                        {/* LEFT: Step number + title + subtitle */}
                        <div className="flex items-start gap-4">
                          {/* Giant step counter */}
                          {sizeStep !== "summary" && (
                            <div className="shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl border border-[#ed1c24]/40 bg-[#ed1c24]/10 shadow-[0_0_18px_rgba(237,28,36,0.25)]">
                              <span className="text-[10px] font-extrabold text-[#ed1c24]/80 uppercase tracking-widest leading-none">STEP</span>
                              <span className="text-xl font-black text-white leading-none mt-0.5">{stepNumber}</span>
                            </div>
                          )}
                          {sizeStep === "summary" && (
                            <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.2)]">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base sm:text-xl font-black text-white leading-tight tracking-tight m-0">
                                {sizeStep === "summary" ? "Tyre Size Ready" : "Select Tyre Size"}
                              </h4>
                              {/* Step label chip */}
                              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/8 border border-white/15 text-[10px] font-black text-white/70 tracking-widest uppercase">
                                {sizeStep === "summary" ? "Complete ✓" : `${stepNumber} of 3`}
                              </span>
                            </div>
                            <p className="text-white/55 text-[11px] sm:text-xs font-medium mt-1 mb-0 leading-snug max-w-xs sm:max-w-md">
                              {sizeStep === "summary"
                                ? "Review your specifications before searching inventory."
                                : sizeStep === "width"
                                ? "Select width in mm — the first number on your sidewall (e.g. 235)."
                                : sizeStep === "height"
                                ? "Select aspect ratio % — the second number on your sidewall (e.g. 40)."
                                : "Select rim diameter in inches — the third number (e.g. R19)."}
                            </p>
                          </div>
                        </div>

                        {/* RIGHT: Spec badge + close */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Floating spec badge */}
                          <div className="hidden md:flex flex-col items-center justify-center min-w-[120px] px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-inner">
                            <span className="text-[8px] uppercase font-extrabold tracking-[0.18em] text-[#ed1c24]/90 leading-none mb-1">
                              {hasRearTyre ? (activeSizeTab === "rear" ? "REAR SPEC" : "FRONT SPEC") : "TYRE SPEC"}
                            </span>
                            <span className="text-sm font-black text-white leading-tight tracking-tight">
                              {activeSizeTab === "rear" ? rearFormatted : frontFormatted}
                            </span>
                          </div>

                          {/* Close */}
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/16 active:bg-white/25 border border-white/12 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                            onClick={closeSize}
                            aria-label="Close"
                          >
                            <X size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      {/* 3-pill segmented step bar */}
                      <div className="flex items-center gap-1.5 mt-3.5">
                        {(["width", "height", "rim"] as const).map((s, idx) => {
                          const isDone = stepNumber > idx + 1 || sizeStep === "summary";
                          const isActive = sizeStep === s;
                          return (
                            <div
                              key={s}
                              className="flex-1 h-1 rounded-full overflow-hidden transition-all duration-300"
                              style={{
                                background: isDone
                                  ? "#10b981"
                                  : isActive
                                  ? "#ed1c24"
                                  : "rgba(255,255,255,0.1)",
                                boxShadow: isActive ? "0 0 8px rgba(237,28,36,0.7)" : isDone ? "0 0 6px rgba(16,185,129,0.5)" : "none",
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Front / Rear Axle Switcher (staggered tyre) */}
                      {hasRearTyre && (
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/8">
                          <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider">Axle:</span>
                          <button
                            type="button"
                            onClick={() => { setActiveSizeTab("front"); if (sizeStep !== "summary") setSizeStep("width"); }}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              activeSizeTab === "front"
                                ? "bg-[#ed1c24] text-white shadow-md font-black"
                                : "border border-white/20 text-white/60 hover:bg-white/8"
                            }`}
                          >
                            <span>Front:</span>
                            <span className="font-extrabold">{frontFormatted}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setActiveSizeTab("rear"); if (sizeStep !== "summary") setSizeStep("width"); }}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              activeSizeTab === "rear"
                                ? "bg-[#ed1c24] text-white shadow-md font-black"
                                : "border border-white/20 text-white/60 hover:bg-white/8"
                            }`}
                          >
                            <span>Rear:</span>
                            <span className="font-extrabold">{rearFormatted}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── BODY (2-COLUMN: HIGH-TECH STEPPER SIDEBAR + DYNAMIC GRID) ── */}
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
                    {/* LEFT COLUMN: INTERACTIVE VISUAL STEPPER & SIDEWALL DIAGRAM */}
                    <div className="hidden md:flex md:w-72 lg:w-80 bg-gradient-to-b from-gray-50 via-slate-50 to-gray-100/90 md:border-r border-gray-200 p-3.5 sm:p-4 flex-col justify-between shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <div>
                        {/* Interactive 3D Animated Tyre Visualizer with Camera Zoom & Rotation */}
                        <TyreSizeVisualizer
                          step={sizeStep}
                          width={currWidth}
                          height={currHeight}
                          rim={currRim}
                          widthLabel={currWidth ? labelFor("width", currWidth) : undefined}
                          heightLabel={currHeight ? labelFor("height", currHeight) : undefined}
                          rimLabel={currRim ? labelFor("rim", currRim) : undefined}
                          vehicleType={isMotorcyclePage ? "motorcycle" : "car"}
                          className="mb-4"
                        />

                        {/* 1-Line Compact 3-Segment Interactive Tyre Spec Bar */}
                        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200 shadow-sm mt-3">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 px-0.5">
                            <span>Select Dimension</span>
                            {currWidth && currHeight && currRim ? (
                              <span className="text-emerald-600 font-extrabold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                                <Check size={11} strokeWidth={3} /> Ready
                              </span>
                            ) : (
                              <span className="text-gray-400 font-bold">
                                Step {sizeStep === "width" ? "1" : sizeStep === "height" ? "2" : sizeStep === "rim" ? "3" : "✓"} of 3
                              </span>
                            )}
                          </div>

                          {/* 3-Column Interactive Step Buttons in 1 Row */}
                          <div className="grid grid-cols-3 gap-1.5 items-center">
                            {/* 1. Width */}
                            <button
                              type="button"
                              onClick={() => setSizeStep("width")}
                              className={`p-2 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center ${
                                sizeStep === "width"
                                  ? "bg-red-50 border-[#ed1c24] text-[#ed1c24] shadow-xs ring-2 ring-red-500/20"
                                  : currWidth
                                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                              }`}
                            >
                              <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">
                                1. Width
                              </span>
                              <span className="text-xs sm:text-[13px] font-black truncate block mt-0.5 leading-tight">
                                {currWidth ? `${labelFor("width", currWidth)}` : "Select"}
                              </span>
                            </button>

                            {/* 2. Height / Profile */}
                            <button
                              type="button"
                              disabled={!currWidth}
                              onClick={() => currWidth && setSizeStep("height")}
                              className={`p-2 rounded-xl text-center transition-all border flex flex-col items-center justify-center ${
                                !currWidth
                                  ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-400"
                                  : sizeStep === "height"
                                  ? "bg-red-50 border-[#ed1c24] text-[#ed1c24] shadow-xs ring-2 ring-red-500/20 cursor-pointer"
                                  : currHeight
                                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 cursor-pointer"
                              }`}
                            >
                              <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">
                                2. Profile
                              </span>
                              <span className="text-xs sm:text-[13px] font-black truncate block mt-0.5 leading-tight">
                                {currHeight ? `${labelFor("height", currHeight)}` : "Select"}
                              </span>
                            </button>

                            {/* 3. Rim */}
                            <button
                              type="button"
                              disabled={!currWidth || !currHeight}
                              onClick={() => currWidth && currHeight && setSizeStep("rim")}
                              className={`p-2 rounded-xl text-center transition-all border flex flex-col items-center justify-center ${
                                !currWidth || !currHeight
                                  ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-400"
                                  : sizeStep === "rim"
                                  ? "bg-red-50 border-[#ed1c24] text-[#ed1c24] shadow-xs ring-2 ring-red-500/20 cursor-pointer"
                                  : currRim
                                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 cursor-pointer"
                              }`}
                            >
                              <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">
                                3. Rim
                              </span>
                              <span className="text-xs sm:text-[13px] font-black truncate block mt-0.5 leading-tight">
                                {currRim
                                  ? `${(labelFor("rim", currRim)).startsWith("R") ? labelFor("rim", currRim) : `R${labelFor("rim", currRim)}`}`
                                  : "Select"}
                              </span>
                            </button>
                          </div>

                          {/* 1-Line Formatted Size Formula Display (e.g. 205 / 70 / R15) */}
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                              Size Formula:
                            </span>
                            <div className="flex items-center gap-1 font-black text-xs sm:text-[13px] text-gray-900 tracking-tight">
                              <span className={currWidth ? "text-gray-900 font-black" : "text-gray-300"}>
                                {currWidth ? labelFor("width", currWidth) : "---"}
                              </span>
                              <span className="text-gray-300 font-bold">/</span>
                              <span className={currHeight ? "text-gray-900 font-black" : "text-gray-300"}>
                                {currHeight ? labelFor("height", currHeight) : "--"}
                              </span>
                              <span className="text-gray-300 font-bold">/</span>
                              <span className={currRim ? "text-[#ed1c24] font-black" : "text-gray-300"}>
                                {currRim ? (labelFor("rim", currRim).startsWith("R") ? labelFor("rim", currRim) : `R${labelFor("rim", currRim)}`) : "---"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: API-DRIVEN OPTION GRID & SUMMARY */}
                    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto finder-modal-scroll bg-white">
                      {depLoading || (sizeStep === "width" && widthLoading) ? (
                        <div className="flex flex-col justify-center items-center py-24 flex-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/images/loader-style1.svg" alt="Loading" width={52} height={52} className="animate-spin" />
                          <span className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wider">
                            Fetching dimensions...
                          </span>
                        </div>
                      ) : sizeStep !== "summary" ? (
                        <>
                          {/* Mobile-only Compact Animated Tyre Visualizer */}
                          <div className="block md:hidden mb-3">
                            <TyreSizeVisualizer
                              step={sizeStep}
                              width={currWidth}
                              height={currHeight}
                              rim={currRim}
                              widthLabel={currWidth ? labelFor("width", currWidth) : undefined}
                              heightLabel={currHeight ? labelFor("height", currHeight) : undefined}
                              rimLabel={currRim ? labelFor("rim", currRim) : undefined}
                              vehicleType={isMotorcyclePage ? "motorcycle" : "car"}
                              isCompact={true}
                            />
                          </div>

                          {/* Search & Grid Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
                            <div>
                              <h5 className="text-base sm:text-lg font-black text-gray-900 m-0 tracking-tight flex items-center gap-2">
                                <span>
                                  {sizeStep === "width"
                                    ? `Select Tyre Width`
                                    : sizeStep === "height"
                                    ? `Select Aspect Ratio / Height`
                                    : `Select Rim Diameter`}
                                </span>
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {filteredOptions.length} options
                                </span>
                              </h5>
                              <p className="text-xs text-gray-500 font-medium m-0 mt-0.5">
                                {sizeStep === "width"
                                  ? "Nominal section width in millimeters (e.g. 235)"
                                  : sizeStep === "height"
                                  ? "Sidewall height as percentage of width (e.g. 40)"
                                  : "Wheel diameter in inches (e.g. R19)"}
                              </p>
                            </div>

                            {/* Search Filter Input */}
                            <div className="relative w-full sm:w-56">
                              <Search
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                              />
                              <input
                                type="text"
                                placeholder={`Filter ${sizeStep}...`}
                                value={sizeQuery}
                                onChange={(e) => setSizeQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#ed1c24] focus:ring-2 focus:ring-red-500/15 transition-all font-medium shadow-2xs"
                              />
                              {sizeQuery && (
                                <button
                                  type="button"
                                  onClick={() => setSizeQuery("")}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Options Grid */}
                          {filteredOptions.length < 5 ? (
                            <div className="flex flex-wrap gap-3 justify-start pt-1 pb-3">
                              {filteredOptions.map((o) => {
                                const isSelected = currVal === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() =>
                                      sizeStep === "width"
                                        ? pickWidth(o.value)
                                        : sizeStep === "height"
                                        ? pickHeight(o.value)
                                        : pickRim(o.value)
                                    }
                                    className={`w-[120px] sm:w-[130px] h-[52px] rounded-xl flex items-center justify-center text-center text-sm sm:text-base font-bold transition-all duration-150 active:scale-95 cursor-pointer shrink-0 relative ${
                                      isSelected
                                        ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/30 font-black scale-[1.02]"
                                        : "border border-gray-200 text-gray-800 bg-white hover:border-red-400 hover:bg-red-50/40 hover:text-[#ed1c24] hover:shadow-xs shadow-2xs font-bold"
                                    }`}
                                  >
                                    <span>{o.label}</span>
                                    {isSelected && (
                                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white ring-2 ring-white/50" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-1 pb-3">
                              {filteredOptions.map((o) => {
                                const isSelected = currVal === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() =>
                                      sizeStep === "width"
                                        ? pickWidth(o.value)
                                        : sizeStep === "height"
                                        ? pickHeight(o.value)
                                        : pickRim(o.value)
                                    }
                                    className={`w-full h-[52px] rounded-xl flex items-center justify-center text-center text-sm sm:text-base font-bold transition-all duration-150 active:scale-95 cursor-pointer relative ${
                                      isSelected
                                        ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/30 font-black scale-[1.02]"
                                        : "border border-gray-200 text-gray-800 bg-white hover:border-red-400 hover:bg-red-50/40 hover:text-[#ed1c24] hover:shadow-xs shadow-2xs font-bold"
                                    }`}
                                  >
                                    <span>{o.label}</span>
                                    {isSelected && (
                                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white ring-2 ring-white/50" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {filteredOptions.length === 0 && (
                            <div className="py-20 text-center text-sm font-medium text-gray-400 flex flex-col items-center justify-center">
                              <span className="text-gray-300 mb-1">No matching size found</span>
                              <button
                                type="button"
                                onClick={() => setSizeQuery("")}
                                className="text-xs text-[#ed1c24] font-bold hover:underline mt-1"
                              >
                                Clear search query
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        /* ── SUMMARY VIEW ── */
                        <div className="py-4 px-2 text-center my-auto flex flex-col justify-center items-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                            <Check size={26} strokeWidth={3} />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 tracking-tight">
                            Ready to search tyres!
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mb-5 font-medium">
                            Confirmed tyre dimensions for your vehicle fitment
                          </p>

                          {/* Specification Confirmation Cards */}
                          <div
                            className={`w-full grid gap-4 mb-5 ${
                              hasRearTyre ? "grid-cols-1 sm:grid-cols-2 max-w-xl" : "max-w-[360px]"
                            }`}
                          >
                            {/* Front Tyre Card */}
                            <div className="text-left bg-white border-2 border-red-100 hover:border-red-300 rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#ed1c24] bg-red-50 px-2 py-0.5 rounded-md">
                                  {hasRearTyre ? "FRONT AXLE" : "ALL TYRES"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSizeTab("front");
                                    setSizeStep("width");
                                  }}
                                  className="text-xs font-black uppercase tracking-wider text-[#ed1c24] hover:text-[#b71218] hover:underline cursor-pointer"
                                >
                                  Edit Size
                                </button>
                              </div>
                              <div className="text-2xl font-black text-gray-900 tracking-tight py-1">
                                {frontFormatted}
                              </div>
                            </div>

                            {/* Rear Tyre Card (if enabled) */}
                            {hasRearTyre && (
                              <div className="text-left bg-white border-2 border-red-100 hover:border-red-300 rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ed1c24] bg-red-50 px-2 py-0.5 rounded-md">
                                    REAR AXLE
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveSizeTab("rear");
                                      setSizeStep("width");
                                    }}
                                    className="text-xs font-black uppercase tracking-wider text-[#ed1c24] hover:text-[#b71218] hover:underline cursor-pointer"
                                  >
                                    Edit Size
                                  </button>
                                </div>
                                <div className="text-2xl font-black text-gray-900 tracking-tight py-1">
                                  {rearFormatted}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Staggered Dual Axle Toggle */}
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                if (hasRearTyre) {
                                  handleSizeSearch(e);
                                  closeSize();
                                } else {
                                  toggleRearMode();
                                }
                              }}
                              className="btn-sweep-light border border-dashed border-gray-300 rounded-xl py-2.5 px-6 inline-flex items-center gap-3 font-bold text-xs uppercase tracking-wider cursor-pointer select-none active:scale-95 shadow-2xs"
                            >
                              <span className="w-5 h-5 rounded-full bg-[#ed1c24] text-white flex items-center justify-center text-xs font-black shrink-0">
                                {hasRearTyre ? "—" : "+"}
                              </span>
                              <span>
                                {hasRearTyre
                                  ? "Search all same size tyres"
                                  : "Add different rear tyre size"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── FOOTER (BACK / NEXT / SEARCH) ── */}
                  <div className="px-5 sm:px-7 py-3.5 border-t border-gray-200 flex items-center justify-between bg-gray-50/80 shrink-0 rounded-b-2xl">
                    <button
                      type="button"
                      className="btn-sweep-light text-xs sm:text-sm font-bold flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer"
                      onClick={handleBackOrCancel}
                    >
                      <ArrowLeft size={16} strokeWidth={2.5} />
                      <span>
                        {sizeStep === "width" && !currWidth && !hasRearTyre ? "Cancel" : "Back"}
                      </span>
                    </button>

                    {sizeStep !== "summary" ? (
                      <button
                        type="button"
                        disabled={!currVal}
                        onClick={handleNextStep}
                        className={`rounded-xl px-7 sm:px-8 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                          currVal
                            ? "btn-slide-red cursor-pointer shadow-md active:scale-95"
                            : "bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <span>Next</span>
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          handleSizeSearch(e);
                          closeSize();
                        }}
                        className="btn-slide-red font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl px-8 py-2.5 flex items-center gap-2 active:scale-95 shadow-md cursor-pointer"
                      >
                        <span>Search Matching Tyres</span>
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* VEHICLE MODAL                                                    */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {vehOpen && (() => {
            const vehFormatted =
              [
                selVehicle ? labelFor("vehicle", selVehicle) : "",
                selModel ? labelFor("model", selModel) : "",
                selYear ? labelFor("year", selYear) : "",
                selEngine ? (selEngine === "all" ? "All Trims" : labelFor("engine", selEngine)) : "",
              ]
                .filter(Boolean)
                .join(" · ") || "—";

            const currVehVal =
              vehStep === "vehicle"
                ? selVehicle
                : vehStep === "model"
                ? selModel
                : vehStep === "year"
                ? selYear
                : vehStep === "engine"
                ? selEngine
                : "";

            const vehStepNumber =
              vehStep === "vehicle"
                ? 1
                : vehStep === "model"
                ? 2
                : vehStep === "year"
                ? 3
                : 4;

            const vehProgressPct =
              vehStep === "vehicle"
                ? 25
                : vehStep === "model"
                ? 50
                : vehStep === "year"
                ? 75
                : 100;

            return (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
                <div className="absolute inset-0" onClick={closeVeh} />
                <div
                  className="relative w-full max-w-[920px] h-[660px] sm:h-[680px] max-h-[94vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Select your vehicle"
                >
                  {/* ── TOP HEADER (DARK PREMIUM) ── */}
                  <div className="relative shrink-0 overflow-hidden" style={{ background: "linear-gradient(135deg,#0d1117 0%,#111827 60%,#1a0a0c 100%)" }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 120% at 20% 50%,rgba(237,28,36,0.18) 0%,transparent 70%)" }} />
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "linear-gradient(to bottom,#ed1c24,#8f0d13)" }} />

                    <div className="pl-6 pr-5 sm:pr-7 pt-4 pb-3.5">
                      <div className="flex items-start justify-between gap-3">
                        {/* LEFT: step badge + title + subtitle */}
                        <div className="flex items-start gap-4">
                          {vehStep !== "summary" ? (
                            <div className="shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl border border-[#ed1c24]/40 bg-[#ed1c24]/10 shadow-[0_0_18px_rgba(237,28,36,0.25)]">
                              <span className="text-[10px] font-extrabold text-[#ed1c24]/80 uppercase tracking-widest leading-none">STEP</span>
                              <span className="text-xl font-black text-white leading-none mt-0.5">{vehStepNumber}</span>
                            </div>
                          ) : (
                            <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.2)]">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base sm:text-xl font-black text-white leading-tight tracking-tight m-0">
                                {vehStep === "summary" ? "Vehicle Confirmed" : "Select Your Vehicle"}
                              </h4>
                              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/8 border border-white/15 text-[10px] font-black text-white/70 tracking-widest uppercase">
                                {vehStep === "summary" ? "Complete ✓" : `${vehStepNumber} of 4`}
                              </span>
                            </div>
                            <p className="text-white/55 text-[11px] sm:text-xs font-medium mt-1 mb-0 leading-snug max-w-xs sm:max-w-md">
                              {vehStep === "vehicle"
                                ? "Choose your vehicle make — brand (e.g. BMW, Toyota, Mercedes)."
                                : vehStep === "model"
                                ? "Choose the exact model for your selected make."
                                : vehStep === "year"
                                ? "Select the manufacture year of your vehicle."
                                : vehStep === "engine" || (vehStep as string) === "size"
                                ? "Choose engine trim and factory-fitted tyre dimensions."
                                : "Review your vehicle and confirmed tyre fitment below."}
                            </p>
                          </div>
                        </div>

                        {/* RIGHT: Spec badge + close */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="hidden md:flex flex-col items-center justify-center min-w-[130px] px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-inner">
                            <span className="text-[8px] uppercase font-extrabold tracking-[0.18em] text-[#ed1c24]/90 leading-none mb-1">VEHICLE SPEC</span>
                            <span className="text-xs font-black text-white leading-tight tracking-tight max-w-[160px] truncate text-center">{vehFormatted}</span>
                          </div>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/16 active:bg-white/25 border border-white/12 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                            onClick={closeVeh}
                            aria-label="Close"
                          >
                            <X size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      {/* 4-pill segmented step bar */}
                      <div className="flex items-center gap-1.5 mt-3.5">
                        {(["vehicle", "model", "year", "engine"] as const).map((s, idx) => {
                          const isDone = vehStepNumber > idx + 1 || vehStep === "summary";
                          const isActive = vehStep === s;
                          return (
                            <div
                              key={s}
                              className="flex-1 h-1 rounded-full transition-all duration-300"
                              style={{
                                background: isDone ? "#10b981" : isActive ? "#ed1c24" : "rgba(255,255,255,0.1)",
                                boxShadow: isActive ? "0 0 8px rgba(237,28,36,0.7)" : isDone ? "0 0 6px rgba(16,185,129,0.5)" : "none",
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── BODY (2-COLUMN) ── */}
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
                    {/* LEFT COLUMN: DARK PREMIUM VEHICLE SIDEBAR */}
                    <div
                      className="hidden md:flex md:w-72 lg:w-80 shrink-0 flex-col justify-between overflow-hidden"
                      style={{ background: "linear-gradient(160deg,#0d1117 0%,#111827 55%,#0f1922 100%)" }}
                    >
                      {/* ambient glow */}
                      <div className="absolute pointer-events-none w-48 h-48 rounded-full left-[-40px] top-8 opacity-20"
                        style={{ background: "radial-gradient(circle,#ed1c24 0%,transparent 70%)" }} />

                      <div className="p-4 sm:p-5">
                        {/* ── Car Anatomy Panel ── */}
                        <div
                          className="rounded-2xl p-3 mb-5 border border-white/8 overflow-hidden"
                          style={{ background: "linear-gradient(135deg,#141922 0%,#1a2030 100%)" }}
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[9px] uppercase font-black tracking-[0.18em] text-white/40">Vehicle Fitment</span>
                            <span
                              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                              style={{
                                background: vehStep === "vehicle" ? "rgba(237,28,36,0.15)" : vehStep === "model" ? "rgba(251,146,60,0.15)" : vehStep === "year" ? "rgba(234,179,8,0.15)" : "rgba(16,185,129,0.15)",
                                color: vehStep === "vehicle" ? "#ef4444" : vehStep === "model" ? "#fb923c" : vehStep === "year" ? "#eab308" : "#10b981",
                                border: `1px solid ${vehStep === "vehicle" ? "rgba(239,68,68,0.3)" : vehStep === "model" ? "rgba(251,146,60,0.3)" : vehStep === "year" ? "rgba(234,179,8,0.3)" : "rgba(16,185,129,0.3)"}`,
                              }}
                            >
                              {vehStep === "vehicle" ? "Make" : vehStep === "model" ? "Model" : vehStep === "year" ? "Year" : "Engine & Size"}
                            </span>
                          </div>

                          {/* Real Car Photo */}
                          <div
                            className="relative h-[96px] w-full rounded-xl overflow-hidden"
                            style={{ background: "#020408" }}
                          >
                            {/* Actual car image */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/images/vehicle-finder-car.jpg"
                              alt="Vehicle"
                              className="w-full h-full object-cover object-center"
                              style={{ opacity: 0.92, mixBlendMode: "lighten" }}
                            />
                            {/* Bottom glow overlay based on step */}
                            <div
                              className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
                              style={{
                                background: `linear-gradient(to top, ${
                                  vehStep === "engine" ? "rgba(16,185,129,0.35)" : "rgba(237,28,36,0.3)"
                                }, transparent)`,
                                transition: "background 0.4s",
                              }}
                            />
                            {/* Vehicle label overlay */}
                            <div className="absolute inset-x-0 top-0 h-7 pointer-events-none"
                              style={{ background: "linear-gradient(to bottom,rgba(2,4,8,0.7),transparent)" }}
                            />
                            <span
                              className="absolute top-1.5 left-0 right-0 text-center text-[8px] font-black uppercase tracking-[0.18em] pointer-events-none"
                              style={{ color: "rgba(255,255,255,0.55)" }}
                            >
                              {selModel
                                ? `${labelFor("vehicle", selVehicle)} ${labelFor("model", selModel)}${selYear ? ` · ${labelFor("year", selYear)}` : ""}`
                                : selVehicle
                                ? labelFor("vehicle", selVehicle)
                                : "Select Vehicle"}
                            </span>
                          </div>
                        </div>

                        {/* ── Horizontal Stepper Bar & Interactive Grid ── */}
                        <div className="rounded-2xl p-3 border border-white/8 bg-white/[0.03] backdrop-blur-md">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/40 mb-2 px-1">
                            <span>Vehicle Steps</span>
                            <span className="text-white/60 font-bold">
                              Step {vehStep === "summary" ? "✓" : vehStepNumber} of 4
                            </span>
                          </div>

                          {/* Horizontal Connected Timeline Dots (1 ── 2 ── 3 ── 4) */}
                          <div className="relative flex items-center justify-between px-3 py-1 mb-3">
                            {/* Background track line */}
                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 z-0" />
                            {/* Active progress line fill */}
                            <div
                              className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#ed1c24] transition-all duration-300 z-0"
                              style={{
                                width:
                                  vehStep === "summary"
                                    ? "100%"
                                    : vehStepNumber === 1
                                    ? "0%"
                                    : vehStepNumber === 2
                                    ? "33.3%"
                                    : vehStepNumber === 3
                                    ? "66.6%"
                                    : "100%",
                              }}
                            />

                            {([
                              { step: "vehicle" as const, num: 1, label: "Make", value: selVehicle ? labelFor("vehicle", selVehicle) : null, canClick: true },
                              { step: "model" as const, num: 2, label: "Model", value: selModel ? labelFor("model", selModel) : null, canClick: Boolean(selVehicle) },
                              { step: "year" as const, num: 3, label: "Year", value: selYear ? labelFor("year", selYear) : null, canClick: Boolean(selVehicle && selModel) },
                              { step: "engine" as const, num: 4, label: "Trim", value: selEngine ? (selEngine === "all" ? "All Trims" : labelFor("engine", selEngine)) : null, canClick: Boolean(selVehicle && selModel && selYear) },
                            ]).map(({ step: s, num, label, value, canClick }) => {
                              const isActive = vehStep === s;
                              const isDone = value !== null && !isActive && (vehStep === "summary" || vehStepNumber > num);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={!canClick}
                                  onClick={() => canClick && setVehStep(s)}
                                  className="relative z-10 flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-all"
                                    style={{
                                      background: isActive
                                        ? "linear-gradient(135deg,#ed1c24,#b71218)"
                                        : isDone
                                        ? "#10b981"
                                        : "#161b22",
                                      border: isActive
                                        ? "2px solid rgba(255,255,255,0.4)"
                                        : isDone
                                        ? "2px solid rgba(16,185,129,0.5)"
                                        : "2px solid rgba(255,255,255,0.15)",
                                      boxShadow: isActive
                                        ? "0 0 12px rgba(237,28,36,0.6)"
                                        : isDone
                                        ? "0 0 8px rgba(16,185,129,0.4)"
                                        : "none",
                                      color: isActive || isDone ? "#fff" : "rgba(255,255,255,0.3)",
                                    }}
                                  >
                                    {isDone ? (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    ) : num}
                                  </div>
                                  <span
                                    className="text-[9px] font-black uppercase tracking-wider mt-1"
                                    style={{ color: isActive ? "#f87171" : isDone ? "#34d399" : "rgba(255,255,255,0.35)" }}
                                  >
                                    {label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* 4 Interactive Step Buttons (2x2 Horizontal Layout) */}
                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            {([
                              { step: "vehicle" as const, num: 1, label: "1. Make", value: selVehicle ? labelFor("vehicle", selVehicle) : null, placeholder: "Select Make", canClick: true },
                              { step: "model" as const, num: 2, label: "2. Model", value: selModel ? labelFor("model", selModel) : null, placeholder: "Select Model", canClick: Boolean(selVehicle) },
                              { step: "year" as const, num: 3, label: "3. Year", value: selYear ? labelFor("year", selYear) : null, placeholder: "Select Year", canClick: Boolean(selVehicle && selModel) },
                              { step: "engine" as const, num: 4, label: "4. Trim & Size", value: selEngine ? (selEngine === "all" ? "All Trims" : labelFor("engine", selEngine)) : null, placeholder: "Select Trim", canClick: Boolean(selVehicle && selModel && selYear) },
                            ]).map(({ step: s, num, label, value, placeholder, canClick }) => {
                              const isActive = vehStep === s;
                              const isDone = value !== null && !isActive && (vehStep === "summary" || vehStepNumber > num);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={!canClick}
                                  onClick={() => canClick && setVehStep(s)}
                                  className="p-2 rounded-xl text-left transition-all border flex flex-col justify-center"
                                  style={{
                                    background: isActive
                                      ? "rgba(237,28,36,0.12)"
                                      : isDone
                                      ? "rgba(16,185,129,0.08)"
                                      : "rgba(255,255,255,0.03)",
                                    borderColor: isActive
                                      ? "rgba(237,28,36,0.4)"
                                      : isDone
                                      ? "rgba(16,185,129,0.25)"
                                      : "rgba(255,255,255,0.07)",
                                    cursor: canClick ? "pointer" : "not-allowed",
                                    opacity: !canClick && !isActive && !isDone ? 0.4 : 1,
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className="text-[9px] font-black uppercase tracking-wider block opacity-70 truncate"
                                      style={{ color: isActive ? "#f87171" : isDone ? "#34d399" : "rgba(255,255,255,0.4)" }}
                                    >
                                      {label}
                                    </span>
                                    {isDone && (
                                      <span className="text-[8px] font-black text-[#34d399]">✓</span>
                                    )}
                                  </div>
                                  <span
                                    className="text-xs font-black truncate block mt-0.5 leading-tight"
                                    style={{
                                      color: isActive
                                        ? value ? "#fca5a5" : "#ffffff"
                                        : isDone
                                        ? "rgba(255,255,255,0.9)"
                                        : "rgba(255,255,255,0.3)",
                                    }}
                                  >
                                    {value || placeholder}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Selected vehicle summary badge */}
                      <div className="px-4 pb-5 pt-2">
                        <div
                          className="rounded-xl p-3 border border-white/8"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <span className="text-[9px] uppercase font-black tracking-[0.16em] block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Selected Vehicle</span>
                          <div className="text-xs font-black text-white/80 tracking-tight truncate">{vehFormatted}</div>
                          {selSize && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-[10px] font-bold text-emerald-400">Tyre: {selSize.label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* RIGHT COLUMN: API-DRIVEN GRID / SUMMARY */}
                    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto finder-modal-scroll bg-white">
                      {depLoading && (vehStep === "vehicle" || vehStep === "model" || vehStep === "year") ? (
                        <div className="flex flex-col justify-center items-center py-24 flex-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/images/loader-style1.svg" alt="Loading" width={52} height={52} className="animate-spin" />
                          <span className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wider">
                            Loading vehicle data...
                          </span>
                        </div>
                      ) : vehStep !== "summary" ? (
                        <>
                          {/* Search Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
                            <div>
                              <h5 className="text-base sm:text-lg font-black text-gray-900 m-0 tracking-tight">
                                {vehStep === "vehicle"
                                  ? "Choose Vehicle Make"
                                  : vehStep === "model"
                                  ? `Choose Model for ${labelFor("vehicle", selVehicle)}`
                                  : vehStep === "year"
                                  ? `Choose Year for ${labelFor("model", selModel)}`
                                  : "Choose Engine Trim & Tyre Size"}
                              </h5>
                              <p className="text-xs text-gray-500 font-medium m-0 mt-0.5">
                                Select your exact vehicle specification below
                              </p>
                            </div>

                            {/* Search Filter Input */}
                            <div className="relative w-full sm:w-56">
                              <Search
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                              />
                              <input
                                type="text"
                                placeholder={`Filter ${vehStep}...`}
                                value={vehQuery}
                                onChange={(e) => setVehQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#ed1c24] focus:ring-2 focus:ring-red-500/15 transition-all font-medium shadow-2xs"
                              />
                              {vehQuery && (
                                <button
                                  type="button"
                                  onClick={() => setVehQuery("")}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Step 1: Make Grid */}
                          {vehStep === "vehicle" && (() => {
                            const opts = vehFilter(meta.vehicle ?? []);
                            return (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 pt-1 pb-3">
                                {opts.map((o) => {
                                  const isSelected = selVehicle === o.value;
                                  return (
                                    <button
                                      key={o.value}
                                      type="button"
                                      onClick={() => pickVehicle(o.value)}
                                      className={`rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer h-[104px] w-full text-center relative ${
                                        isSelected
                                          ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/25 font-black scale-[1.02]"
                                          : "border border-gray-200 text-gray-900 bg-white hover:border-red-400 hover:bg-red-50/40 hover:text-[#ed1c24] hover:shadow-xs shadow-2xs font-bold"
                                      }`}
                                    >
                                      <VehicleLogo label={o.label} logoUrl={o.logo} />
                                      <span className="text-xs font-extrabold line-clamp-1">
                                        {o.label}
                                      </span>
                                      {isSelected && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white ring-2 ring-white/50" />
                                      )}
                                    </button>
                                  );
                                })}
                                {opts.length === 0 && (
                                  <div className="col-span-full py-16 text-center text-sm font-medium text-gray-400">
                                    {vehQuery ? `No makes matching "${vehQuery}".` : "No makes available."}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Step 2: Model Grid */}
                          {vehStep === "model" && (() => {
                            const opts = vehFilter(displayModels);
                            return (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 pt-1 pb-3">
                                {opts.map((o) => {
                                  const isSelected = selModel === o.value;
                                  return (
                                    <button
                                      key={o.value}
                                      type="button"
                                      onClick={() => pickModel(o.value)}
                                      className={`w-full h-[52px] rounded-xl flex items-center justify-center text-center text-sm font-bold transition-all duration-150 active:scale-95 cursor-pointer px-3 relative ${
                                        isSelected
                                          ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/25 font-black scale-[1.02]"
                                          : "border border-gray-200 text-gray-900 bg-white hover:border-red-400 hover:bg-red-50/40 hover:text-[#ed1c24] hover:shadow-xs shadow-2xs"
                                      }`}
                                    >
                                      <span className="truncate">{o.label}</span>
                                      {isSelected && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white ring-2 ring-white/50" />
                                      )}
                                    </button>
                                  );
                                })}
                                {opts.length === 0 && (
                                  <div className="col-span-full py-16 text-center text-sm font-medium text-gray-400">
                                    {vehQuery ? `No models matching "${vehQuery}".` : "No models for this make."}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Step 3: Year Grid */}
                          {vehStep === "year" && (() => {
                            const opts = vehFilter(displayYears);
                            return (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3 pt-1 pb-3">
                                {opts.map((o) => {
                                  const isSelected = selYear === o.value;
                                  return (
                                    <button
                                      key={o.value}
                                      type="button"
                                      onClick={() => pickYear(o.value)}
                                      className={`w-full h-[52px] rounded-xl flex items-center justify-center text-center text-sm sm:text-base font-bold transition-all duration-150 active:scale-95 cursor-pointer relative ${
                                        isSelected
                                          ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/25 font-black scale-[1.02]"
                                          : "border border-gray-200 text-gray-900 bg-white hover:border-red-400 hover:bg-red-50/40 hover:text-[#ed1c24] hover:shadow-xs shadow-2xs"
                                      }`}
                                    >
                                      <span>{o.label}</span>
                                      {isSelected && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white ring-2 ring-white/50" />
                                      )}
                                    </button>
                                  );
                                })}
                                {opts.length === 0 && (
                                  <div className="col-span-full py-16 text-center text-sm font-medium text-gray-400">
                                    {vehQuery ? `No years matching "${vehQuery}".` : "No years for this model."}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Step 4: Engine + Sizes Combined View */}
                          {vehStep === "engine" && (() => {
                            const baseOpts: AttrOption[] =
                              displayEngines.length > 0
                                ? displayEngines
                                : [{ label: "All Trims", value: "all" }];
                            const filtered = vehFilter(baseOpts);

                            const groups = filtered.reduce<Record<string, AttrOption[]>>((acc, eng) => {
                              const key = eng.fuel ?? "Petrol";
                              (acc[key] ??= []).push(eng);
                              return acc;
                            }, {});

                            return (
                              <div className="space-y-4 w-full pt-1">
                                {Object.entries(groups).map(([fuel, engs]) => (
                                  <div key={fuel} className="w-full">
                                    <h4 className="font-black text-sm sm:text-base text-gray-900 mb-2.5 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
                                      <span>{fuel === "Trims" || fuel === "Other" ? "Engine Variants" : fuel}</span>
                                    </h4>

                                    {/* Engine Options Pills */}
                                    <div className="flex flex-wrap items-center gap-2.5 mb-5">
                                      {engs.map((o) => {
                                        const isSelected = selEngine === o.value;
                                        const cleanLabel = o.label.replace(/\s*\d+\s*hp/i, "").trim();
                                        const hpVal = o.hp || o.label.match(/(\d+)\s*hp/i)?.[1];
                                        return (
                                          <button
                                            key={o.value}
                                            type="button"
                                            onClick={() => setSelEngine(o.value)}
                                            className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer select-none active:scale-95 ${
                                              isSelected
                                                ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/20 font-black"
                                                : "border-gray-200 text-gray-800 bg-white hover:border-gray-400 hover:bg-gray-50 shadow-2xs"
                                            }`}
                                          >
                                            <span>{cleanLabel || o.label}</span>
                                            {hpVal ? (
                                              <sup className="text-[10px] font-semibold ml-1 bg-black/10 px-1 py-0.5 rounded">{hpVal}hp</sup>
                                            ) : null}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Sizes for selected engine */}
                                    {depLoading ? (
                                      <div className="flex justify-center items-center py-10">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/images/loader-style1.svg" alt="Loading" width={44} height={44} className="animate-spin" />
                                      </div>
                                    ) : displaySizes.length > 0 ? (
                                      <div className="space-y-2 pt-1">
                                        <div className="text-xs font-black uppercase text-gray-500 tracking-wider">
                                          Compatible Tyre Dimensions:
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                          {displaySizes.map((s) => {
                                            const isSelected = selSize?.label === s.label && selSize?.rearLabel === s.rearLabel;
                                            const rimVal = s.rim ? (s.rim.includes('"') ? s.rim : `${s.rim}"`) : "";

                                            return (
                                              <button
                                                key={`${s.label}-${s.rearLabel ?? ""}`}
                                                type="button"
                                                onClick={() => pickSize(s)}
                                                className={`relative border rounded-xl px-4 py-3.5 cursor-pointer transition-all hover:shadow-md active:scale-95 text-left inline-flex items-center gap-2.5 flex-wrap ${
                                                  isSelected
                                                    ? "border-2 border-[#ed1c24] bg-red-50/70 shadow-sm"
                                                    : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/70 shadow-2xs"
                                                }`}
                                              >
                                                {/* Badge */}
                                                <span className="absolute -top-2.5 left-3 bg-[#ed1c24] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                                  {s.isFactory ? "Factory Fitment" : "Optional Fitment"}
                                                </span>

                                                <div className="flex items-center flex-wrap gap-2 text-sm sm:text-base font-extrabold text-gray-900 mt-1">
                                                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                                    {rimVal && <span className="text-[#ed1c24] font-black">{rimVal}</span>}
                                                    <span>{s.label}</span>
                                                    {s.speedIndex && (
                                                      <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide leading-none">
                                                        {s.speedIndex}
                                                      </span>
                                                    )}
                                                  </span>

                                                  {s.rearLabel && (
                                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap ml-1 sm:ml-2">
                                                      <span className="text-gray-400 font-normal">Rear:</span>
                                                      <span>{s.rearLabel}</span>
                                                      {s.rearSpeedIndex && (
                                                        <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide leading-none">
                                                          {s.rearSpeedIndex}
                                                        </span>
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="py-6 text-center text-xs text-gray-400">
                                        No tyre sizes found for this trim.
                                      </div>
                                    )}

                                    {/* Note */}
                                    <p className="text-xs text-gray-500 mt-6 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                                      💡 <span className="font-bold">Recommendation:</span> Most vehicles offer multiple rim and profile options. Please verify the dimensions printed on your current sidewall.
                                    </p>
                                  </div>
                                ))}
                                {filtered.length === 0 && (
                                  <div className="py-16 text-center text-sm font-medium text-gray-400">
                                    No engine trims found.
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        /* ── SUMMARY VIEW ── */
                        <div className="py-4 px-2 text-center my-auto flex flex-col justify-center items-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                            <Check size={26} strokeWidth={3} />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 tracking-tight">
                            Vehicle Fitment Ready!
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mb-5 font-medium">
                            Confirmed specifications for your car model
                          </p>

                          <div className="w-full max-w-lg mb-5">
                            <div className="text-left bg-white border-2 border-red-100 rounded-2xl p-5 shadow-sm hover:border-red-300 transition-all">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#ed1c24] bg-red-50 px-2.5 py-0.5 rounded-full">
                                  CONFIRMED VEHICLE
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVehStep("engine");
                                  }}
                                  className="text-xs font-black uppercase tracking-wider text-[#ed1c24] hover:text-[#b71218] hover:underline cursor-pointer"
                                >
                                  Edit Fitment
                                </button>
                              </div>
                              <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight my-2">
                                {labelFor("vehicle", selVehicle)} {labelFor("model", selModel)}
                              </div>
                              <div className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">
                                Year: <span className="text-gray-900 font-bold">{labelFor("year", selYear)}</span>
                                {selEngine && (
                                  <>
                                    {" • "}Trim:{" "}
                                    <span className="text-gray-900 font-bold">
                                      {selEngine === "all" ? "All Trims" : labelFor("engine", selEngine)}
                                    </span>
                                  </>
                                )}
                              </div>
                              {selSize && (
                                <div className="text-sm font-bold text-gray-900 mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                                  <span className="text-gray-500 font-medium">Tyre Dimensions:</span>
                                  <span className="text-[#ed1c24] font-black">{selSize.label}</span>
                                  {selSize.rearLabel && (
                                    <>
                                      <span className="text-gray-400">/</span>
                                      <span className="text-[#ed1c24] font-black">{selSize.rearLabel}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── FOOTER ── */}
                  <div className="px-5 sm:px-7 py-3.5 border-t border-gray-200 flex items-center justify-between bg-gray-50/80 shrink-0 rounded-b-2xl">
                    <button
                      type="button"
                      className="btn-sweep-light text-xs sm:text-sm font-bold flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer"
                      onClick={handleVehBack}
                    >
                      <ArrowLeft size={16} strokeWidth={2.5} />
                      <span>
                        {vehStep === "vehicle" && !selVehicle ? "Cancel" : "Back"}
                      </span>
                    </button>

                    {vehStep !== "summary" && vehStep !== "engine" ? (
                      <button
                        type="button"
                        disabled={!currVehVal}
                        onClick={handleVehNext}
                        className={`rounded-xl px-7 sm:px-8 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                          currVehVal
                            ? "btn-slide-red cursor-pointer shadow-md active:scale-95"
                            : "bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <span>Next</span>
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </button>
                    ) : vehStep === "summary" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          handleVehicleSearch(e);
                          closeVeh();
                        }}
                        className="btn-slide-red font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl px-8 py-2.5 flex items-center gap-2 active:scale-95 shadow-md cursor-pointer"
                      >
                        <span>Search Matching Tyres</span>
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })()}
        </>,
        document.body
      )}
    </div>
  );
}
