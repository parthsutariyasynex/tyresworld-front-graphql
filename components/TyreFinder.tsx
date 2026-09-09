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
import { buildFilterParams } from "@/lib/filterBuilder";

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

function getVehicleLogo(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${slug}.png`;
}

function VehicleLogo({ label, logoUrl }: { label: string; logoUrl?: string }) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const primaryUrl = logoUrl || `https://wheel-api.klever.ae/logos/${slug}.png`;
  const fallbackUrl = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${slug}.png`;
  const fallbackUrl2 = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${slug}.png`;

  const [currentSrc, setCurrentSrc] = useState(primaryUrl);
  const [attempt, setAttempt] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleError = () => {
    if (attempt === 0) {
      setAttempt(1);
      setCurrentSrc(fallbackUrl);
    } else if (attempt === 1) {
      setAttempt(2);
      setCurrentSrc(fallbackUrl2);
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
export default function TyreFinder({ locale: localeProp, categoryUid, basePath, disableSticky }: TyreFinderProps) {
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

  /* ── category param included in every size request ─────────────── */
  const catParam: Record<string, string> = categoryUid ? { category_uid: categoryUid } : {};

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
    fetch("/api/tyre-finder")
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
  }, []);

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
    router.push(
      `${dest}?${appendCategory(buildFilterParams(filterObj, [...SIZE_FIELDS]))}`
    );
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
    router.push(
      `${dest}?${appendCategory(
        buildFilterParams(filterObj, [...SIZE_FIELDS])
      )}`
    );
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
    router.push(
      `${dest}?${appendCategory(
        buildFilterParams(filterObj, [...SIZE_FIELDS])
      )}`
    );
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
                {([
                  { id: "size", label: "Search Tyre Size" },
                  { id: "vehicle", label: "Search By Vehicle" },
                ] as { id: Tab; label: string }[]).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
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

            return (
              <div
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
                onClick={closeSize}
              >
                <div
                  className="relative w-full max-w-[780px] h-[590px] sm:h-[620px] max-h-[92vh] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Find tyres by size"
                >
                  {/* ── RED GRADIENT HEADER ── */}
                  <div className="text-white p-5 sm:p-6 pb-4 relative rounded-t-md flex-shrink-0 bg-gradient-to-r from-[#ab1218] via-[#ed1c24] to-[#c7171e] shadow-md">
                    {/* Top Close Button */}
                    <button
                      type="button"
                      className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer z-10"
                      onClick={closeSize}
                      aria-label="Close"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>

                    {/* Top Row: Title + Current Selection badge */}
                    <div className="flex items-start justify-between gap-3 mb-4 pr-10">
                      <div>
                        <h4 className="text-xl sm:text-2xl font-black text-white leading-tight m-0 tracking-tight">
                          {sizeStep === "summary" ? "Ready to search!" : "What size are your tyres?"}
                        </h4>
                        <p className="text-white/85 text-xs sm:text-[13px] font-medium mt-1 mb-0 leading-snug">
                          {sizeStep === "summary"
                            ? "Review your selected tyre specifications."
                            : sizeStep === "width"
                            ? "Pick the width — it's the first number on your sidewall (e.g. 235)."
                            : sizeStep === "height"
                            ? "Now the aspect ratio (height) — the second number (e.g. 40)."
                            : "Finally, the rim diameter in inches (e.g. R20)."}
                        </p>
                      </div>

                      {/* Current Selection Capsule */}
                      <div className="bg-black/35 backdrop-blur-md rounded-md px-3.5 py-1.5 text-center min-w-[130px] border border-white/20 shrink-0 shadow-inner hidden sm:block">
                        {!hasRearTyre ? (
                          <>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-red-200/90 block leading-tight">
                              CURRENT SELECTION
                            </span>
                            <span className="text-xs sm:text-[13px] font-bold text-white block mt-0.5 leading-tight">
                              {frontFormatted}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[8px] uppercase font-bold tracking-wider text-red-200/90 block leading-tight">
                              FRONT SIZE
                            </span>
                            <span className="text-xs font-bold text-white block mt-0.5 leading-tight">
                              {frontFormatted}
                            </span>
                            <div className="border-t border-white/20 my-0.5" />
                            <span className="text-[8px] uppercase font-bold tracking-wider text-red-200/90 block leading-tight">
                              REAR
                            </span>
                            <span className="text-xs font-bold text-white block mt-0.5 leading-tight">
                              {rearFormatted}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Step Tabs Row (WIDTH / HEIGHT / RIM) */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {/* Width Tab */}
                      {(() => {
                        const isDone = Boolean(currWidth) && sizeStep !== "width";
                        const isActive = sizeStep === "width";
                        return (
                          <div
                            onClick={() => setSizeStep("width")}
                            className={`relative rounded-md p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 text-left transition-all cursor-pointer select-none ${
                              isActive
                                ? "bg-white text-gray-900 shadow-xl border-2 border-white scale-[1.02]"
                                : isDone
                                ? "bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                                : "bg-white/10 hover:bg-white/15 border border-white/15 text-white/75"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                                isActive
                                  ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <ArrowLeftRight size={18} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider block leading-tight ${
                                  isActive ? "text-gray-400" : "text-white/80"
                                }`}
                              >
                                WIDTH
                              </span>
                              <span
                                className={`text-xs sm:text-[15px] font-black block leading-tight mt-0.5 truncate ${
                                  isActive
                                    ? currWidth ? "text-[#ed1c24]" : "text-gray-900"
                                    : currWidth ? "text-white font-bold" : "text-white/60"
                                }`}
                              >
                                {currWidth ? labelFor("width", currWidth) : "Select"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Height Tab */}
                      {(() => {
                        const isDone = Boolean(currHeight) && (sizeStep === "rim" || sizeStep === "summary");
                        const isActive = sizeStep === "height";
                        return (
                          <div
                            onClick={() => currWidth && setSizeStep("height")}
                            className={`relative rounded-md p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 text-left transition-all cursor-pointer select-none ${
                              isActive
                                ? "bg-white text-gray-900 shadow-xl border-2 border-white scale-[1.02]"
                                : isDone
                                ? "bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                                : "bg-white/10 hover:bg-white/15 border border-white/15 text-white/75"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                                isActive
                                  ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <ArrowUpDown size={18} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider block leading-tight ${
                                  isActive ? "text-gray-400" : "text-white/80"
                                }`}
                              >
                                HEIGHT
                              </span>
                              <span
                                className={`text-xs sm:text-[15px] font-black block leading-tight mt-0.5 truncate ${
                                  isActive
                                    ? currHeight ? "text-[#ed1c24]" : "text-gray-900"
                                    : currHeight ? "text-white font-bold" : "text-white/60"
                                }`}
                              >
                                {currHeight ? labelFor("height", currHeight) : "Select"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Rim Tab */}
                      {(() => {
                        const isDone = Boolean(currRim) && sizeStep === "summary";
                        const isActive = sizeStep === "rim" || (sizeStep === "summary" && Boolean(currRim));
                        return (
                          <div
                            onClick={() => currWidth && currHeight && setSizeStep("rim")}
                            className={`relative rounded-md p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 text-left transition-all cursor-pointer select-none ${
                              isActive
                                ? "bg-white text-gray-900 shadow-xl border-2 border-white scale-[1.02]"
                                : isDone
                                ? "bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                                : "bg-white/10 hover:bg-white/15 border border-white/15 text-white/75"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                                isActive
                                  ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <CircleDot size={18} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider block leading-tight ${
                                  isActive ? "text-gray-400" : "text-white/80"
                                }`}
                              >
                                RIM
                              </span>
                              <span
                                className={`text-xs sm:text-[15px] font-black block leading-tight mt-0.5 truncate ${
                                  isActive
                                    ? currRim ? "text-[#ed1c24]" : "text-gray-900"
                                    : currRim ? "text-white font-bold" : "text-white/60"
                                }`}
                              >
                                {currRim
                                  ? currRim.startsWith("R")
                                    ? currRim
                                    : `R${labelFor("rim", currRim)}`
                                  : "Select"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Front / Rear Switcher Pills (when Rear Tyre Size is active) */}
                    {hasRearTyre && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSizeTab("front");
                            if (sizeStep !== "summary") setSizeStep("width");
                          }}
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            activeSizeTab === "front"
                              ? "bg-white text-[#ed1c24] shadow-md"
                              : "border border-white/40 text-white hover:bg-white/10 font-semibold"
                          }`}
                        >
                          Front Size
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSizeTab("rear");
                            if (sizeStep !== "summary") setSizeStep("width");
                          }}
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            activeSizeTab === "rear"
                              ? "bg-white text-[#ed1c24] shadow-md"
                              : "border border-white/40 text-white hover:bg-white/10 font-semibold"
                          }`}
                        >
                          Rear Size
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── WHITE BODY ── */}
                  <div className="px-5 sm:px-6 py-4 flex-1 overflow-y-auto finder-modal-scroll bg-white flex flex-col justify-start">
                    {depLoading || (sizeStep === "width" && widthLoading) ? (
                      <div className="flex justify-center items-center py-16 flex-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/loader-style1.svg" alt="Loading" width={56} height={56} />
                      </div>
                    ) : sizeStep !== "summary" ? (
                      <>
                        {/* Search Bar */}
                        <div className="relative mb-4 shrink-0">
                          <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <input
                            type="text"
                            placeholder={`Search ${activeSizeTab === "rear" ? "rear " : ""}${sizeStep}...`}
                            value={sizeQuery}
                            onChange={(e) => setSizeQuery(e.target.value)}
                            className="w-full bg-gray-50/90 border border-gray-200 rounded-md pl-11 pr-10 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#ed1c24] focus:ring-2 focus:ring-red-500/15 transition-all font-medium shadow-2xs"
                          />
                          {sizeQuery && (
                            <button
                              type="button"
                              onClick={() => setSizeQuery("")}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>

                        {/* Options List / Grid */}
                        {filteredOptions.length < 5 ? (
                          <div className="flex flex-wrap gap-3 justify-center pt-2">
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
                                  className={`w-[130px] h-[48px] sm:h-[50px] rounded-md flex items-center justify-center text-center text-sm sm:text-[15px] font-bold transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
                                    isSelected
                                      ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/25 font-black"
                                      : "border border-gray-200 text-gray-800 bg-white hover:border-red-400 hover:bg-red-50/50 hover:text-[#ed1c24] hover:shadow-sm shadow-2xs"
                                  }`}
                                >
                                  {o.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3 pt-1 pb-2">
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
                                  className={`w-full h-[48px] sm:h-[50px] rounded-md flex items-center justify-center text-center text-sm sm:text-[15px] font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                                    isSelected
                                      ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/25 font-black"
                                      : "border border-gray-200 text-gray-800 bg-white hover:border-red-400 hover:bg-red-50/50 hover:text-[#ed1c24] hover:shadow-sm shadow-2xs"
                                  }`}
                                >
                                  {o.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {filteredOptions.length === 0 && (
                          <div className="py-14 text-center text-sm font-medium text-gray-400">
                            No options available.
                          </div>
                        )}
                      </>
                    ) : (
                      /* ── READY TO SEARCH / SUMMARY VIEW ── */
                      <div className="py-2 px-2 text-center my-auto flex flex-col justify-center items-center">
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 tracking-tight">
                          Ready to search!
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-4 font-medium">
                          Your selected tyre size
                        </p>

                        {/* Selection Cards */}
                        <div
                          className={`w-full grid gap-3.5 mb-4 ${
                            hasRearTyre ? "grid-cols-1 sm:grid-cols-2 max-w-2xl" : "max-w-[320px]"
                          }`}
                        >
                          {/* Front Tyre Card */}
                          <div className="text-left bg-white border border-gray-200 rounded-md p-4 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-all">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-xs">
                                {hasRearTyre ? "FRONT TYRES" : "ALL TYRES"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSizeTab("front");
                                  setSizeStep("width");
                                }}
                                className="text-xs font-bold uppercase tracking-wider text-[#ed1c24] hover:text-[#b71218] hover:underline cursor-pointer"
                              >
                                EDIT
                              </button>
                            </div>
                            <div className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight py-0.5">
                              {frontFormatted}
                            </div>
                          </div>

                          {/* Rear Tyre Card (if enabled) */}
                          {hasRearTyre && (
                            <div className="text-left bg-white border border-gray-200 rounded-md p-4 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-all">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-xs">
                                  REAR TYRES
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSizeTab("rear");
                                    setSizeStep("width");
                                  }}
                                  className="text-xs font-bold uppercase tracking-wider text-[#ed1c24] hover:text-[#b71218] hover:underline cursor-pointer"
                                >
                                  EDIT
                                </button>
                              </div>
                              <div className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight py-0.5">
                                {rearFormatted}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Add / Same Size Switcher Button */}
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
                            className="border border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50/40 rounded-md py-2.5 px-6 inline-flex items-center gap-3 font-bold text-xs uppercase tracking-wider text-gray-700 transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#ed1c24] text-white flex items-center justify-center text-xs font-black shrink-0">
                              {hasRearTyre ? "—" : "+"}
                            </span>
                            <span>
                              {hasRearTyre
                                ? "SEARCH ALL SAME SIZE TYRES"
                                : "ADD DIFFERENT REAR TYRE SIZE"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── FOOTER ── */}
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-b-md">
                    <button
                      type="button"
                      className="text-sm font-bold text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors px-4 py-2.5 rounded-md hover:bg-gray-100 cursor-pointer"
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
                        className={`rounded-md px-8 py-2.5 sm:py-3 text-sm font-bold flex items-center gap-2 transition-all ${
                          currVal
                            ? "bg-gradient-to-r from-[#ed1c24] to-[#c9141b] hover:from-[#c9141b] hover:to-[#a30d12] text-white cursor-pointer shadow-md shadow-red-500/25 active:scale-95 hover:scale-[1.01]"
                            : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
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
                        className="bg-gradient-to-r from-[#ed1c24] to-[#c9141b] hover:from-[#c9141b] hover:to-[#a30d12] text-white font-bold text-sm uppercase tracking-wider rounded-md px-8 py-2.5 sm:py-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-red-500/25 cursor-pointer"
                      >
                        <span>Search</span>
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

            return (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
                <div className="absolute inset-0" onClick={closeVeh} />
                <div className="relative w-full max-w-[780px] h-[590px] sm:h-[620px] max-h-[92vh] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                  {/* ── RED GRADIENT HEADER ── */}
                  <div className="text-white p-5 sm:p-6 pb-4 relative rounded-t-md flex-shrink-0 bg-gradient-to-r from-[#ab1218] via-[#ed1c24] to-[#c7171e] shadow-md">
                    {/* Top Close Button */}
                    <button
                      type="button"
                      className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer z-10"
                      onClick={closeVeh}
                      aria-label="Close"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>

                    <div className="flex items-start justify-between gap-3 mb-4 pr-10">
                      {/* Left: Titles */}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight m-0">
                          {vehStep === "summary"
                            ? "Ready to search!"
                            : "Which vehicle are you looking for?"}
                        </h2>
                        <p className="text-white/85 text-xs sm:text-[13px] font-medium mt-1 mb-0 leading-snug">
                          {vehStep === "vehicle"
                            ? "Pick the vehicle make (e.g. BMW, Toyota, Mercedes)."
                            : vehStep === "model"
                            ? "Now pick your vehicle model."
                            : vehStep === "year"
                            ? "Select the manufacture year."
                            : vehStep === "engine" || (vehStep as string) === "size"
                            ? "Select a factory tyre size."
                            : "Your selected vehicle."}
                        </p>
                      </div>

                      {/* Right: CURRENT SELECTION Capsule */}
                      <div className="bg-black/35 backdrop-blur-md rounded-md px-3.5 py-1.5 text-center min-w-[130px] border border-white/20 shrink-0 shadow-inner hidden sm:block">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-red-200/90 block leading-tight">
                          CURRENT SELECTION
                        </span>
                        <span className="text-xs sm:text-[13px] font-bold text-white block mt-0.5 max-w-[220px] truncate">
                          {vehFormatted}
                        </span>
                      </div>
                    </div>

                    {/* ── 4 STEP TABS ROW (Make / Model / Year / Engine) ── */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                      {/* Step 1: Make */}
                      {(() => {
                        const isDone = Boolean(selVehicle) && vehStep !== "vehicle";
                        const isActive = vehStep === "vehicle";
                        return (
                          <div
                            onClick={() => setVehStep("vehicle")}
                            className={`relative rounded-md p-2 sm:p-2.5 flex items-center gap-2 text-left transition-all cursor-pointer select-none ${
                              isActive
                                ? "bg-white text-gray-900 shadow-xl border-2 border-white scale-[1.02]"
                                : isDone
                                ? "bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                                : "bg-white/10 hover:bg-white/15 border border-white/15 text-white/75"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                                isActive
                                  ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={16} strokeWidth={3} />
                              ) : (
                                <Car size={16} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-[9.5px] uppercase font-extrabold tracking-wider block leading-tight ${
                                  isActive ? "text-gray-400" : "text-white/80"
                                }`}
                              >
                                MAKE
                              </span>
                              <span
                                className={`text-xs font-black block leading-tight mt-0.5 truncate ${
                                  isActive
                                    ? selVehicle ? "text-[#ed1c24]" : "text-gray-900"
                                    : selVehicle ? "text-white font-bold" : "text-white/60"
                                }`}
                              >
                                {selVehicle ? labelFor("vehicle", selVehicle) : "Select"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Step 2: Model */}
                      {(() => {
                        const isDone =
                          Boolean(selModel) &&
                          (vehStep === "year" || vehStep === "engine" || vehStep === "summary");
                        const isActive = vehStep === "model";
                        return (
                          <div
                            onClick={() => selVehicle && setVehStep("model")}
                            className={`relative rounded-md p-2 sm:p-2.5 flex items-center gap-2 text-left transition-all cursor-pointer select-none ${
                              isActive
                                ? "bg-white text-gray-900 shadow-xl border-2 border-white scale-[1.02]"
                                : isDone
                                ? "bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                                : "bg-white/10 hover:bg-white/15 border border-white/15 text-white/75"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                                isActive
                                  ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={16} strokeWidth={3} />
                              ) : (
                                <Layers size={16} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-[9.5px] uppercase font-extrabold tracking-wider block leading-tight ${
                                  isActive ? "text-gray-400" : "text-white/80"
                                }`}
                              >
                                MODEL
                              </span>
                              <span
                                className={`text-xs font-black block leading-tight mt-0.5 truncate ${
                                  isActive
                                    ? selModel ? "text-[#ed1c24]" : "text-gray-900"
                                    : selModel ? "text-white font-bold" : "text-white/60"
                                }`}
                              >
                                {selModel ? labelFor("model", selModel) : "Select"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Step 3: Year */}
                      {(() => {
                        const isDone =
                          Boolean(selYear) && (vehStep === "engine" || vehStep === "summary");
                        const isActive = vehStep === "year";
                        return (
                          <div
                            onClick={() => selVehicle && selModel && setVehStep("year")}
                            className={`relative rounded-md p-2 sm:p-2.5 flex items-center gap-2 text-left transition-all cursor-pointer select-none ${
                              isActive
                                ? "bg-white text-gray-900 shadow-xl border-2 border-white scale-[1.02]"
                                : isDone
                                ? "bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                                : "bg-white/10 hover:bg-white/15 border border-white/15 text-white/75"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                                isActive
                                  ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={16} strokeWidth={3} />
                              ) : (
                                <Calendar size={16} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-[9.5px] uppercase font-extrabold tracking-wider block leading-tight ${
                                  isActive ? "text-gray-400" : "text-white/80"
                                }`}
                              >
                                YEAR
                              </span>
                              <span
                                className={`text-xs font-black block leading-tight mt-0.5 truncate ${
                                  isActive
                                    ? selYear ? "text-[#ed1c24]" : "text-gray-900"
                                    : selYear ? "text-white font-bold" : "text-white/60"
                                }`}
                              >
                                {selYear ? labelFor("year", selYear) : "Select"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Step 4: Engine */}
                      {(() => {
                        const isDone = Boolean(selEngine);
                        const isActive = vehStep === "engine";
                        return (
                          <div
                            onClick={() => selVehicle && selModel && selYear && setVehStep("engine")}
                            className={`relative rounded-md p-2 sm:p-2.5 flex items-center gap-2 text-left transition-all cursor-pointer select-none ${
                              isActive
                                ? "bg-white text-gray-900 shadow-xl border-2 border-white scale-[1.02]"
                                : isDone
                                ? "bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                                : "bg-white/10 hover:bg-white/15 border border-white/15 text-white/75"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                                isActive
                                  ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={16} strokeWidth={3} />
                              ) : (
                                <Gauge size={16} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-[9.5px] uppercase font-extrabold tracking-wider block leading-tight ${
                                  isActive ? "text-gray-400" : "text-white/80"
                                }`}
                              >
                                ENGINE
                              </span>
                              <span
                                className={`text-xs font-black block leading-tight mt-0.5 truncate ${
                                  isActive
                                    ? selEngine ? "text-[#ed1c24]" : "text-gray-900"
                                    : selEngine ? "text-white font-bold" : "text-white/60"
                                }`}
                              >
                                {selEngine
                                  ? selEngine === "all"
                                    ? "All Trims"
                                    : labelFor("engine", selEngine)
                                  : "Select"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ── WHITE BODY ── */}
                  <div className="px-5 sm:px-6 py-4 flex-1 overflow-y-auto finder-modal-scroll bg-white flex flex-col justify-start">
                    {depLoading && (vehStep === "vehicle" || vehStep === "model" || vehStep === "year") ? (
                      <div className="flex justify-center items-center py-16 flex-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/loader-style1.svg" alt="Loading" width={56} height={56} />
                      </div>
                    ) : vehStep !== "summary" ? (
                      <>
                        {/* Search Bar */}
                        <div className="relative mb-4 shrink-0">
                          <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <input
                            type="text"
                            placeholder="Search here ..."
                            value={vehQuery}
                            onChange={(e) => setVehQuery(e.target.value)}
                            className="w-full bg-gray-50/90 border border-gray-200 rounded-md pl-11 pr-10 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#ed1c24] focus:ring-2 focus:ring-red-500/15 transition-all font-medium shadow-2xs"
                          />
                          {vehQuery && (
                            <button
                              type="button"
                              onClick={() => setVehQuery("")}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>

                        {/* Step 1: Make Grid */}
                        {vehStep === "vehicle" && (() => {
                          const opts = vehFilter(meta.vehicle ?? []);
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3 pt-1 pb-2">
                              {opts.map((o) => {
                                const isSelected = selVehicle === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => pickVehicle(o.value)}
                                    className={`rounded-md p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer h-[100px] w-full text-center ${
                                      isSelected
                                        ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/25"
                                        : "border border-gray-200 text-gray-900 bg-white hover:border-red-400 hover:bg-red-50/50 hover:text-[#ed1c24] hover:shadow-sm shadow-2xs"
                                    }`}
                                  >
                                    <VehicleLogo label={o.label} logoUrl={o.logo} />
                                    <span className="text-xs font-bold line-clamp-1">
                                      {o.label}
                                    </span>
                                  </button>
                                );
                              })}
                              {opts.length === 0 && (
                                <div className="col-span-full py-14 text-center text-sm font-medium text-gray-400">
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 pt-1 pb-2">
                              {opts.map((o) => {
                                const isSelected = selModel === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => pickModel(o.value)}
                                    className={`w-full h-[48px] sm:h-[50px] rounded-md flex items-center justify-center text-center text-sm font-bold transition-all duration-150 active:scale-95 cursor-pointer px-3 ${
                                      isSelected
                                        ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/25"
                                        : "border border-gray-200 text-gray-900 bg-white hover:border-red-400 hover:bg-red-50/50 hover:text-[#ed1c24] hover:shadow-sm shadow-2xs"
                                    }`}
                                  >
                                    <span className="truncate">{o.label}</span>
                                  </button>
                                );
                              })}
                              {opts.length === 0 && (
                                <div className="col-span-full py-14 text-center text-sm font-medium text-gray-400">
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
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3 pt-1 pb-2">
                              {opts.map((o) => {
                                const isSelected = selYear === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => pickYear(o.value)}
                                    className={`w-full h-[48px] sm:h-[50px] rounded-md flex items-center justify-center text-center text-sm sm:text-[15px] font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                                      isSelected
                                        ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/25"
                                        : "border border-gray-200 text-gray-900 bg-white hover:border-red-400 hover:bg-red-50/50 hover:text-[#ed1c24] hover:shadow-sm shadow-2xs"
                                    }`}
                                  >
                                    {o.label}
                                  </button>
                                );
                              })}
                              {opts.length === 0 && (
                                <div className="col-span-full py-14 text-center text-sm font-medium text-gray-400">
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
                                  {/* Fuel Header: e.g. "Petrol" */}
                                  <h4 className="text-center font-black text-base sm:text-lg text-gray-900 mb-3.5">
                                    {fuel === "Trims" || fuel === "Other" ? "Petrol" : fuel}
                                  </h4>

                                  {/* Centered Engine Options Pills */}
                                  <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
                                    {engs.map((o) => {
                                      const isSelected = selEngine === o.value;
                                      const cleanLabel = o.label.replace(/\s*\d+\s*hp/i, "").trim();
                                      const hpVal = o.hp || o.label.match(/(\d+)\s*hp/i)?.[1];
                                      return (
                                        <button
                                          key={o.value}
                                          type="button"
                                          onClick={() => setSelEngine(o.value)}
                                          className={`px-5 py-2.5 rounded-md border text-sm font-bold transition-all cursor-pointer select-none active:scale-95 ${
                                            isSelected
                                              ? "border-2 border-[#ed1c24] text-white bg-gradient-to-r from-[#ed1c24] to-[#c9141b] shadow-md shadow-red-500/20"
                                              : "border-gray-200 text-gray-800 bg-white hover:border-gray-400 hover:bg-gray-50"
                                          }`}
                                        >
                                          <span>{cleanLabel || o.label}</span>
                                          {hpVal ? (
                                            <sup className="text-[10px] font-semibold ml-0.5">{hpVal}hp</sup>
                                          ) : null}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Sizes for selected engine */}
                                  {depLoading ? (
                                    <div className="flex justify-center items-center py-8">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src="/images/loader-style1.svg" alt="Loading" width={44} height={44} />
                                    </div>
                                  ) : displaySizes.length > 0 ? (
                                    <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                                      {displaySizes.map((s) => {
                                        const isSelected = selSize?.label === s.label && selSize?.rearLabel === s.rearLabel;
                                        const rimVal = s.rim ? (s.rim.includes('"') ? s.rim : `${s.rim}"`) : "";

                                        return (
                                          <button
                                            key={`${s.label}-${s.rearLabel ?? ""}`}
                                            type="button"
                                            onClick={() => pickSize(s)}
                                            className={`relative border rounded-md px-4 py-3 cursor-pointer transition-all hover:shadow-md active:scale-95 text-left inline-flex items-center gap-2 flex-wrap ${
                                              isSelected
                                                ? "border-2 border-[#ed1c24] bg-red-50/50 shadow-sm"
                                                : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/60"
                                            }`}
                                          >
                                            {/* Red FACTORY SIZE / OPTIONAL SIZE tag */}
                                            <span className="absolute -top-2.5 left-3 bg-[#ed1c24] text-white text-[9px] font-bold px-2 py-0.5 rounded-[3px] uppercase tracking-wider shadow-xs">
                                              {s.isFactory ? "FACTORY SIZE" : "OPTIONAL SIZE"}
                                            </span>

                                            <div className="flex items-center flex-wrap gap-2 text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                                              {/* Front Size */}
                                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                                {rimVal && <span>{rimVal} | </span>}
                                                <span>{s.label}</span>
                                                {s.speedIndex && (
                                                  <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide leading-none">
                                                    {s.speedIndex}
                                                  </span>
                                                )}
                                              </span>

                                              {/* Rear Size (if staggered fitment) */}
                                              {s.rearLabel && (
                                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap ml-1 sm:ml-2">
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
                                  ) : (
                                    <div className="py-6 text-center text-xs text-gray-400">
                                      No tyre sizes found for this trim.
                                    </div>
                                  )}

                                  {/* Disclaimer Note */}
                                  <p className="text-center text-xs italic text-gray-600 mt-8 max-w-xl mx-auto leading-relaxed">
                                    Note: Most vehicle manufacturer&apos;s produce vehicles with more than one possible size. We strongly recommend all customers check the tyre size printed on the side wall of their tyres before purchase.
                                  </p>
                                </div>
                              ))}
                              {filtered.length === 0 && (
                                <div className="py-14 text-center text-sm font-medium text-gray-400">
                                  No engine trims found.
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      /* ── READY TO SEARCH / SUMMARY VIEW ── */
                      <div className="py-2 px-2 text-center my-auto flex flex-col justify-center items-center">
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 tracking-tight">
                          Ready to search!
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-4 font-medium">
                          Your selected vehicle
                        </p>

                        <div className="w-full max-w-lg mb-4">
                          <div className="text-left bg-white border border-gray-200 rounded-md p-5 shadow-xs hover:border-gray-300 transition-all">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-xs">
                                SELECTED VEHICLE
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setVehStep("engine");
                                }}
                                className="text-xs font-bold uppercase tracking-wider text-[#ed1c24] hover:text-[#b71218] hover:underline cursor-pointer"
                              >
                                EDIT
                              </button>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight my-2">
                              {labelFor("vehicle", selVehicle)} {labelFor("model", selModel)}
                            </div>
                            <div className="text-sm font-semibold text-gray-600 mt-1">
                              Year: <span className="text-gray-900 font-bold">{labelFor("year", selYear)}</span>
                              {selEngine && (
                                <>
                                  {" • "}Engine:{" "}
                                  <span className="text-gray-900 font-bold">
                                    {selEngine === "all" ? "All Trims" : labelFor("engine", selEngine)}
                                  </span>
                                </>
                              )}
                            </div>
                            {/* The size is what the search actually filters on. */}
                            {selSize && (
                              <div className="text-sm font-semibold text-gray-600 mt-1.5 pt-1.5 border-t border-gray-100">
                                Tyre size:{" "}
                                <span className="text-gray-900 font-bold">{selSize.label}</span>
                                {selSize.rearLabel && (
                                  <>
                                    {" • "}Rear:{" "}
                                    <span className="text-gray-900 font-bold">{selSize.rearLabel}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── FOOTER ── */}
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-b-md">
                    <button
                      type="button"
                      className="text-sm font-bold text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors px-4 py-2.5 rounded-md hover:bg-gray-100 cursor-pointer"
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
                        className={`rounded-md px-8 py-2.5 sm:py-3 text-sm font-bold flex items-center gap-2 transition-all ${
                          currVehVal
                            ? "bg-gradient-to-r from-[#ed1c24] to-[#c9141b] hover:from-[#c9141b] hover:to-[#a30d12] text-white cursor-pointer shadow-md shadow-red-500/25 active:scale-95 hover:scale-[1.01]"
                            : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
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
                        className="bg-gradient-to-r from-[#ed1c24] to-[#c9141b] hover:from-[#c9141b] hover:to-[#a30d12] text-white font-bold text-sm uppercase tracking-wider rounded-md px-8 py-2.5 sm:py-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-red-500/25 cursor-pointer"
                      >
                        <span>Search</span>
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
