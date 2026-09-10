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
                  {/* ── TOP HEADER ── */}
                  <div className="text-white px-5 sm:px-7 pt-4 pb-3.5 relative bg-gradient-to-r from-[#8f0d13] via-[#ed1c24] to-[#c7171e] shadow-md shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Title + Progress Chip */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight m-0">
                            Select your tyre size
                          </h4>
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/30 backdrop-blur-md border border-white/25 text-[11px] sm:text-xs font-black text-white tracking-wide shadow-inner">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {sizeStep === "summary" ? "Complete" : `${stepNumber} of 3`}
                          </span>
                        </div>
                        <p className="text-white/90 text-xs sm:text-[13px] font-medium mt-1 mb-0 leading-snug">
                          {sizeStep === "summary"
                            ? "Review your tyre specifications before searching available inventory."
                            : sizeStep === "width"
                            ? "Step 1 of 3: Select the tyre width in millimeters (first number, e.g. 235)."
                            : sizeStep === "height"
                            ? "Step 2 of 3: Select aspect ratio / height percentage (second number, e.g. 40)."
                            : "Step 3 of 3: Select wheel rim diameter in inches (third number, e.g. R19)."}
                        </p>
                      </div>

                      {/* Right: Spec pill + Close Button */}
                      <div className="flex items-center gap-3">
                        <div className="bg-black/35 backdrop-blur-md rounded-xl px-3.5 py-1.5 text-center min-w-[125px] border border-white/20 shrink-0 hidden md:block shadow-inner">
                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-red-200 block leading-tight">
                            {hasRearTyre ? (activeSizeTab === "rear" ? "REAR AXLE SPEC" : "FRONT AXLE SPEC") : "TYRE SPEC"}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-white block mt-0.5 leading-tight tracking-tight">
                            {activeSizeTab === "rear" ? rearFormatted : frontFormatted}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/35 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
                          onClick={closeSize}
                          aria-label="Close"
                        >
                          <X size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Staggered Front / Rear Axle Switcher */}
                    {hasRearTyre && (
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/20">
                        <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider">Axle:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSizeTab("front");
                            if (sizeStep !== "summary") setSizeStep("width");
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeSizeTab === "front"
                              ? "bg-white text-[#ed1c24] shadow-md font-black"
                              : "border border-white/35 text-white hover:bg-white/10"
                          }`}
                        >
                          <span>Front Axle:</span>
                          <span className="font-extrabold">{frontFormatted}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSizeTab("rear");
                            if (sizeStep !== "summary") setSizeStep("width");
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeSizeTab === "rear"
                              ? "bg-white text-[#ed1c24] shadow-md font-black"
                              : "border border-white/35 text-white hover:bg-white/10"
                          }`}
                        >
                          <span>Rear Axle:</span>
                          <span className="font-extrabold">{rearFormatted}</span>
                        </button>
                      </div>
                    )}

                    {/* 3-Segment Progress Line */}
                    <div className="w-full bg-black/20 h-1 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* ── BODY (2-COLUMN: HIGH-TECH STEPPER SIDEBAR + DYNAMIC GRID) ── */}
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
                    {/* LEFT COLUMN: INTERACTIVE VISUAL STEPPER & SIDEWALL DIAGRAM */}
                    <div className="w-full md:w-72 lg:w-80 bg-gradient-to-b from-gray-50 via-slate-50 to-gray-100/90 border-b md:border-b-0 md:border-r border-gray-200 p-4 sm:p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
                      <div>
                        {/* Interactive Sidewall Visual Diagram */}
                        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-2xs mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                              Sidewall Anatomy
                            </span>
                            <span className="text-[10px] font-bold text-[#ed1c24] bg-red-50 px-1.5 py-0.5 rounded">
                              {sizeStep === "width" ? "Width (mm)" : sizeStep === "height" ? "Aspect Ratio (%)" : sizeStep === "rim" ? "Rim (inches)" : "Complete"}
                            </span>
                          </div>

                          {/* Tyre Cross-Section SVG Diagram */}
                          <div className="relative h-28 w-full flex items-center justify-center bg-gray-900 rounded-lg p-2 overflow-hidden shadow-inner">
                            <svg viewBox="0 0 200 100" className="w-full h-full">
                              {/* Outer Tyre Tread */}
                              <rect
                                x="40"
                                y="8"
                                width="120"
                                height="20"
                                rx="4"
                                className={`transition-all duration-200 ${
                                  sizeStep === "width"
                                    ? "fill-[#ed1c24] stroke-white stroke-2 drop-shadow"
                                    : currWidth
                                    ? "fill-gray-700 stroke-emerald-400 stroke-1"
                                    : "fill-gray-800 stroke-gray-600 stroke-1"
                                }`}
                              />
                              <text
                                x="100"
                                y="22"
                                textAnchor="middle"
                                className="fill-white font-black text-[9px] uppercase tracking-wider"
                              >
                                {currWidth ? `${labelFor("width", currWidth)} mm` : "1. Width"}
                              </text>

                              {/* Left & Right Sidewall (Height) */}
                              <path
                                d="M 40 28 Q 28 55 42 82 L 58 82 Q 46 55 58 28 Z"
                                className={`transition-all duration-200 ${
                                  sizeStep === "height"
                                    ? "fill-[#ed1c24] stroke-white stroke-2 drop-shadow"
                                    : currHeight
                                    ? "fill-gray-700 stroke-emerald-400 stroke-1"
                                    : "fill-gray-800 stroke-gray-600 stroke-1"
                                }`}
                              />
                              <path
                                d="M 160 28 Q 172 55 158 82 L 142 82 Q 154 55 142 28 Z"
                                className={`transition-all duration-200 ${
                                  sizeStep === "height"
                                    ? "fill-[#ed1c24] stroke-white stroke-2 drop-shadow"
                                    : currHeight
                                    ? "fill-gray-700 stroke-emerald-400 stroke-1"
                                    : "fill-gray-800 stroke-gray-600 stroke-1"
                                }`}
                              />
                              <text
                                x="26"
                                y="58"
                                textAnchor="middle"
                                className="fill-white font-bold text-[8px]"
                              >
                                {currHeight ? `${labelFor("height", currHeight)}%` : "2. Height"}
                              </text>

                              {/* Center Wheel Rim */}
                              <circle
                                cx="100"
                                cy="58"
                                r="24"
                                className={`transition-all duration-200 ${
                                  sizeStep === "rim"
                                    ? "fill-[#ed1c24] stroke-white stroke-2 drop-shadow"
                                    : currRim
                                    ? "fill-gray-700 stroke-emerald-400 stroke-1"
                                    : "fill-gray-800 stroke-gray-600 stroke-1"
                                }`}
                              />
                              <circle cx="100" cy="58" r="8" className="fill-gray-900 stroke-gray-600 stroke-1" />
                              <text
                                x="100"
                                y="62"
                                textAnchor="middle"
                                className="fill-white font-black text-[9px] uppercase tracking-tight"
                              >
                                {currRim ? (currRim.startsWith("R") ? currRim : `R${labelFor("rim", currRim)}`) : "3. Rim"}
                              </text>
                            </svg>
                          </div>
                        </div>

                        {/* Stepper Card Buttons */}
                        <div className="space-y-1.5">
                          {/* Step 1: Width */}
                          {(() => {
                            const isDone = Boolean(currWidth) && sizeStep !== "width";
                            const isActive = sizeStep === "width";
                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setSizeStep("width")}
                                  className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer border ${
                                    isActive
                                      ? "bg-white border-[#ed1c24] shadow-md ring-2 ring-[#ed1c24]/20 scale-[1.01]"
                                      : isDone
                                      ? "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white shadow-2xs"
                                      : "bg-white/40 border-transparent opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                                      isActive
                                        ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white shadow-md shadow-red-500/30"
                                        : isDone
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {isDone ? <Check size={17} strokeWidth={3} /> : "1"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                          isActive ? "text-[#ed1c24]" : "text-gray-500"
                                        }`}
                                      >
                                        Width (mm)
                                      </span>
                                      {isDone && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          ✓ Selected
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm sm:text-base font-black truncate leading-tight mt-0.5 ${
                                        isActive
                                          ? currWidth ? "text-[#ed1c24]" : "text-gray-900"
                                          : isDone
                                          ? "text-gray-900 font-extrabold"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {currWidth ? `${labelFor("width", currWidth)} mm` : "Select Width"}
                                    </div>
                                  </div>
                                </button>
                                <div className="w-0.5 h-2 bg-gray-300/80 ml-7 my-0.5" />
                              </div>
                            );
                          })()}

                          {/* Step 2: Height */}
                          {(() => {
                            const isDone = Boolean(currHeight) && (sizeStep === "rim" || sizeStep === "summary");
                            const isActive = sizeStep === "height";
                            const isClickable = Boolean(currWidth);
                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={!isClickable}
                                  onClick={() => isClickable && setSizeStep("height")}
                                  className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all border ${
                                    !isClickable ? "cursor-not-allowed opacity-45 bg-transparent border-transparent" : "cursor-pointer"
                                  } ${
                                    isActive
                                      ? "bg-white border-[#ed1c24] shadow-md ring-2 ring-[#ed1c24]/20 scale-[1.01]"
                                      : isDone
                                      ? "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white shadow-2xs"
                                      : "bg-white/40 border-transparent opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                                      isActive
                                        ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white shadow-md shadow-red-500/30"
                                        : isDone
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {isDone ? <Check size={17} strokeWidth={3} /> : "2"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                          isActive ? "text-[#ed1c24]" : "text-gray-500"
                                        }`}
                                      >
                                        Height / Profile
                                      </span>
                                      {isDone && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          ✓ Selected
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm sm:text-base font-black truncate leading-tight mt-0.5 ${
                                        isActive
                                          ? currHeight ? "text-[#ed1c24]" : "text-gray-900"
                                          : isDone
                                          ? "text-gray-900 font-extrabold"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {currHeight ? `${labelFor("height", currHeight)} %` : "Select Height"}
                                    </div>
                                  </div>
                                </button>
                                <div className="w-0.5 h-2 bg-gray-300/80 ml-7 my-0.5" />
                              </div>
                            );
                          })()}

                          {/* Step 3: Rim */}
                          {(() => {
                            const isDone = Boolean(currRim) && sizeStep === "summary";
                            const isActive = sizeStep === "rim";
                            const isClickable = Boolean(currWidth && currHeight);
                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={!isClickable}
                                  onClick={() => isClickable && setSizeStep("rim")}
                                  className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all border ${
                                    !isClickable ? "cursor-not-allowed opacity-45 bg-transparent border-transparent" : "cursor-pointer"
                                  } ${
                                    isActive
                                      ? "bg-white border-[#ed1c24] shadow-md ring-2 ring-[#ed1c24]/20 scale-[1.01]"
                                      : isDone
                                      ? "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white shadow-2xs"
                                      : "bg-white/40 border-transparent opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                                      isActive
                                        ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white shadow-md shadow-red-500/30"
                                        : isDone
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {isDone ? <Check size={17} strokeWidth={3} /> : "3"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                          isActive ? "text-[#ed1c24]" : "text-gray-500"
                                        }`}
                                      >
                                        Rim Diameter
                                      </span>
                                      {isDone && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          ✓ Selected
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm sm:text-base font-black truncate leading-tight mt-0.5 ${
                                        isActive
                                          ? currRim ? "text-[#ed1c24]" : "text-gray-900"
                                          : isDone
                                          ? "text-gray-900 font-extrabold"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {currRim
                                        ? currRim.startsWith("R")
                                          ? currRim
                                          : `R${labelFor("rim", currRim)}`
                                        : "Select Rim"}
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Live Full Specification Capsule Card */}
                      <div className="mt-4 pt-3 border-t border-gray-200/80 hidden md:block">
                        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">
                              Configured Size
                            </span>
                            <span className="text-[10px] font-black text-[#ed1c24] uppercase">
                              {activeSizeTab === "rear" ? "Rear" : "Front"}
                            </span>
                          </div>
                          <div className="text-lg font-black text-gray-900 tracking-tight mt-0.5">
                            {activeSizeTab === "rear" ? rearFormatted : frontFormatted}
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
                              className="border border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50/40 rounded-xl py-2.5 px-6 inline-flex items-center gap-3 font-bold text-xs uppercase tracking-wider text-gray-700 transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
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
                      className="text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 flex items-center gap-2 transition-colors px-4 py-2.5 rounded-xl hover:bg-gray-200/60 cursor-pointer"
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
                            ? "bg-gradient-to-r from-[#ed1c24] to-[#c9141b] hover:from-[#c9141b] hover:to-[#a30d12] text-white cursor-pointer shadow-md shadow-red-500/25 active:scale-95 hover:scale-[1.01]"
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
                        className="bg-gradient-to-r from-[#ed1c24] to-[#c9141b] hover:from-[#c9141b] hover:to-[#a30d12] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl px-8 py-2.5 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-red-500/25 cursor-pointer"
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
                  {/* ── TOP HEADER ── */}
                  <div className="text-white px-5 sm:px-7 pt-4 pb-3.5 relative bg-gradient-to-r from-[#8f0d13] via-[#ed1c24] to-[#c7171e] shadow-md shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Title + Progress */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight m-0">
                            Select your vehicle
                          </h4>
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/30 backdrop-blur-md border border-white/25 text-[11px] sm:text-xs font-black text-white tracking-wide shadow-inner">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {vehStep === "summary" ? "Complete" : `${vehStepNumber} of 4`}
                          </span>
                        </div>
                        <p className="text-white/90 text-xs sm:text-[13px] font-medium mt-1 mb-0 leading-snug">
                          {vehStep === "vehicle"
                            ? "Step 1 of 4: Select your vehicle make (e.g. BMW, Toyota, Mercedes)."
                            : vehStep === "model"
                            ? "Step 2 of 4: Select your vehicle model."
                            : vehStep === "year"
                            ? "Step 3 of 4: Select the manufacture year."
                            : vehStep === "engine" || (vehStep as string) === "size"
                            ? "Step 4 of 4: Choose engine trim and factory tyre dimensions."
                            : "Review vehicle and confirmed tyre fitment."}
                        </p>
                      </div>

                      {/* Right: Spec pill + Close Button */}
                      <div className="flex items-center gap-3">
                        <div className="bg-black/35 backdrop-blur-md rounded-xl px-3.5 py-1.5 text-center min-w-[130px] border border-white/20 shrink-0 hidden md:block shadow-inner">
                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-red-200 block leading-tight">
                            VEHICLE SPEC
                          </span>
                          <span className="text-xs sm:text-sm font-black text-white block mt-0.5 max-w-[200px] truncate leading-tight tracking-tight">
                            {vehFormatted}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/35 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
                          onClick={closeVeh}
                          aria-label="Close"
                        >
                          <X size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* 4-Segment Progress Bar */}
                    <div className="w-full bg-black/20 h-1 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-300 rounded-full"
                        style={{ width: `${vehProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* ── BODY (2-COLUMN: VERTICAL STEPPER LEFT + OPTION GRID RIGHT) ── */}
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
                    {/* LEFT COLUMN: VEHICLE STEPPER & CAR ANATOMY */}
                    <div className="w-full md:w-72 lg:w-80 bg-gradient-to-b from-gray-50 via-slate-50 to-gray-100/90 border-b md:border-b-0 md:border-r border-gray-200 p-4 sm:p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
                      <div>
                        {/* Vehicle Anatomy Illustration Box */}
                        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-2xs mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                              Vehicle Fitment
                            </span>
                            <span className="text-[10px] font-bold text-[#ed1c24] bg-red-50 px-1.5 py-0.5 rounded">
                              {vehStep === "vehicle" ? "Make" : vehStep === "model" ? "Model" : vehStep === "year" ? "Year" : "Engine & Size"}
                            </span>
                          </div>

                          {/* Car Blueprint SVG Graphic */}
                          <div className="relative h-24 w-full flex items-center justify-center bg-gray-900 rounded-lg p-2 overflow-hidden shadow-inner">
                            <svg viewBox="0 0 220 90" className="w-full h-full">
                              {/* Car Body Silhouette */}
                              <path
                                d="M 25 58 L 40 45 L 75 32 L 145 32 L 175 45 L 200 52 L 205 65 L 185 65 L 175 65 C 175 52 155 52 155 65 L 75 65 C 75 52 55 52 55 65 L 20 65 Z"
                                className={`transition-all duration-200 ${
                                  vehStep === "vehicle" || vehStep === "model"
                                    ? "fill-[#ed1c24] stroke-white stroke-2 drop-shadow"
                                    : selVehicle
                                    ? "fill-gray-700 stroke-emerald-400 stroke-1"
                                    : "fill-gray-800 stroke-gray-600 stroke-1"
                                }`}
                              />
                              {/* Windows */}
                              <path
                                d="M 78 36 L 110 36 L 110 46 L 60 46 Z"
                                className="fill-cyan-950/80 stroke-cyan-400/40 stroke-1"
                              />
                              <path
                                d="M 115 36 L 142 36 L 165 46 L 115 46 Z"
                                className="fill-cyan-950/80 stroke-cyan-400/40 stroke-1"
                              />
                              {/* Front Wheel */}
                              <circle
                                cx="165"
                                cy="65"
                                r="14"
                                className={`transition-all duration-200 ${
                                  vehStep === "engine"
                                    ? "fill-[#ed1c24] stroke-white stroke-2"
                                    : selSize
                                    ? "fill-emerald-500 stroke-white stroke-1"
                                    : "fill-gray-600 stroke-gray-400 stroke-1"
                                }`}
                              />
                              <circle cx="165" cy="65" r="6" className="fill-gray-900" />
                              {/* Rear Wheel */}
                              <circle
                                cx="65"
                                cy="65"
                                r="14"
                                className={`transition-all duration-200 ${
                                  vehStep === "engine"
                                    ? "fill-[#ed1c24] stroke-white stroke-2"
                                    : selSize
                                    ? "fill-emerald-500 stroke-white stroke-1"
                                    : "fill-gray-600 stroke-gray-400 stroke-1"
                                }`}
                              />
                              <circle cx="65" cy="65" r="6" className="fill-gray-900" />
                              {/* Car Model Text overlay */}
                              <text
                                x="110"
                                y="78"
                                textAnchor="middle"
                                className="fill-white font-black text-[9px] uppercase tracking-wider"
                              >
                                {selModel ? `${labelFor("model", selModel)} (${selYear || "—"})` : selVehicle ? labelFor("vehicle", selVehicle) : "Select Car"}
                              </text>
                            </svg>
                          </div>
                        </div>

                        {/* Stepper Cards */}
                        <div className="space-y-1.5">
                          {/* Step 1: Make */}
                          {(() => {
                            const isDone = Boolean(selVehicle) && vehStep !== "vehicle";
                            const isActive = vehStep === "vehicle";
                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setVehStep("vehicle")}
                                  className={`w-full p-2.5 sm:p-3 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer border ${
                                    isActive
                                      ? "bg-white border-[#ed1c24] shadow-md ring-2 ring-[#ed1c24]/20 scale-[1.01]"
                                      : isDone
                                      ? "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white shadow-2xs"
                                      : "bg-white/40 border-transparent opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                                      isActive
                                        ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white shadow-md shadow-red-500/30"
                                        : isDone
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {isDone ? <Check size={16} strokeWidth={3} /> : "1"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                          isActive ? "text-[#ed1c24]" : "text-gray-500"
                                        }`}
                                      >
                                        Make (Brand)
                                      </span>
                                      {isDone && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          ✓ Selected
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm font-black truncate leading-tight mt-0.5 ${
                                        isActive
                                          ? selVehicle ? "text-[#ed1c24]" : "text-gray-900"
                                          : isDone
                                          ? "text-gray-900 font-extrabold"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {selVehicle ? labelFor("vehicle", selVehicle) : "Select Make"}
                                    </div>
                                  </div>
                                </button>
                                <div className="w-0.5 h-2 bg-gray-300/80 ml-6 my-0.5" />
                              </div>
                            );
                          })()}

                          {/* Step 2: Model */}
                          {(() => {
                            const isDone =
                              Boolean(selModel) &&
                              (vehStep === "year" || vehStep === "engine" || vehStep === "summary");
                            const isActive = vehStep === "model";
                            const isClickable = Boolean(selVehicle);
                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={!isClickable}
                                  onClick={() => isClickable && setVehStep("model")}
                                  className={`w-full p-2.5 sm:p-3 rounded-xl flex items-center gap-3 text-left transition-all border ${
                                    !isClickable ? "cursor-not-allowed opacity-45 bg-transparent border-transparent" : "cursor-pointer"
                                  } ${
                                    isActive
                                      ? "bg-white border-[#ed1c24] shadow-md ring-2 ring-[#ed1c24]/20 scale-[1.01]"
                                      : isDone
                                      ? "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white shadow-2xs"
                                      : "bg-white/40 border-transparent opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                                      isActive
                                        ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white shadow-md shadow-red-500/30"
                                        : isDone
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {isDone ? <Check size={16} strokeWidth={3} /> : "2"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                          isActive ? "text-[#ed1c24]" : "text-gray-500"
                                        }`}
                                      >
                                        Model
                                      </span>
                                      {isDone && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          ✓ Selected
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm font-black truncate leading-tight mt-0.5 ${
                                        isActive
                                          ? selModel ? "text-[#ed1c24]" : "text-gray-900"
                                          : isDone
                                          ? "text-gray-900 font-extrabold"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {selModel ? labelFor("model", selModel) : "Select Model"}
                                    </div>
                                  </div>
                                </button>
                                <div className="w-0.5 h-2 bg-gray-300/80 ml-6 my-0.5" />
                              </div>
                            );
                          })()}

                          {/* Step 3: Year */}
                          {(() => {
                            const isDone =
                              Boolean(selYear) && (vehStep === "engine" || vehStep === "summary");
                            const isActive = vehStep === "year";
                            const isClickable = Boolean(selVehicle && selModel);
                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={!isClickable}
                                  onClick={() => isClickable && setVehStep("year")}
                                  className={`w-full p-2.5 sm:p-3 rounded-xl flex items-center gap-3 text-left transition-all border ${
                                    !isClickable ? "cursor-not-allowed opacity-45 bg-transparent border-transparent" : "cursor-pointer"
                                  } ${
                                    isActive
                                      ? "bg-white border-[#ed1c24] shadow-md ring-2 ring-[#ed1c24]/20 scale-[1.01]"
                                      : isDone
                                      ? "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white shadow-2xs"
                                      : "bg-white/40 border-transparent opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                                      isActive
                                        ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white shadow-md shadow-red-500/30"
                                        : isDone
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {isDone ? <Check size={16} strokeWidth={3} /> : "3"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                          isActive ? "text-[#ed1c24]" : "text-gray-500"
                                        }`}
                                      >
                                        Year
                                      </span>
                                      {isDone && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          ✓ Selected
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm font-black truncate leading-tight mt-0.5 ${
                                        isActive
                                          ? selYear ? "text-[#ed1c24]" : "text-gray-900"
                                          : isDone
                                          ? "text-gray-900 font-extrabold"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {selYear ? labelFor("year", selYear) : "Select Year"}
                                    </div>
                                  </div>
                                </button>
                                <div className="w-0.5 h-2 bg-gray-300/80 ml-6 my-0.5" />
                              </div>
                            );
                          })()}

                          {/* Step 4: Engine & Size */}
                          {(() => {
                            const isDone = Boolean(selEngine && selSize);
                            const isActive = vehStep === "engine";
                            const isClickable = Boolean(selVehicle && selModel && selYear);
                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={!isClickable}
                                  onClick={() => isClickable && setVehStep("engine")}
                                  className={`w-full p-2.5 sm:p-3 rounded-xl flex items-center gap-3 text-left transition-all border ${
                                    !isClickable ? "cursor-not-allowed opacity-45 bg-transparent border-transparent" : "cursor-pointer"
                                  } ${
                                    isActive
                                      ? "bg-white border-[#ed1c24] shadow-md ring-2 ring-[#ed1c24]/20 scale-[1.01]"
                                      : isDone
                                      ? "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white shadow-2xs"
                                      : "bg-white/40 border-transparent opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                                      isActive
                                        ? "bg-gradient-to-br from-[#ed1c24] to-[#b71218] text-white shadow-md shadow-red-500/30"
                                        : isDone
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {isDone ? <Check size={16} strokeWidth={3} /> : "4"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                          isActive ? "text-[#ed1c24]" : "text-gray-500"
                                        }`}
                                      >
                                        Engine & Fitment
                                      </span>
                                      {isDone && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          ✓ Selected
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm font-black truncate leading-tight mt-0.5 ${
                                        isActive
                                          ? selEngine ? "text-[#ed1c24]" : "text-gray-900"
                                          : isDone
                                          ? "text-gray-900 font-extrabold"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {selEngine
                                        ? selEngine === "all"
                                          ? "All Trims"
                                          : labelFor("engine", selEngine)
                                        : "Select Trim & Size"}
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Configured Vehicle Badge */}
                      <div className="mt-4 pt-3 border-t border-gray-200/80 hidden md:block">
                        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs">
                          <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">
                            SELECTED VEHICLE
                          </span>
                          <div className="text-sm font-black text-gray-900 tracking-tight mt-0.5 truncate">
                            {vehFormatted}
                          </div>
                          {selSize && (
                            <div className="text-xs font-bold text-[#ed1c24] mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
                              <span>Tyre: {selSize.label}</span>
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
                      className="text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 flex items-center gap-2 transition-colors px-4 py-2.5 rounded-xl hover:bg-gray-200/60 cursor-pointer"
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
                            ? "bg-gradient-to-r from-[#ed1c24] to-[#c9141b] hover:from-[#c9141b] hover:to-[#a30d12] text-white cursor-pointer shadow-md shadow-red-500/25 active:scale-95 hover:scale-[1.01]"
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
                        className="bg-gradient-to-r from-[#ed1c24] to-[#c9141b] hover:from-[#c9141b] hover:to-[#a30d12] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl px-8 py-2.5 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-red-500/25 cursor-pointer"
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
