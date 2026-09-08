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

const SIZE_FIELDS = ["width", "height", "rim"] as const;

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
    /* width/height/rim only. Magento's ProductAttributeFilterInput has no rear
       counterpart (no rear_width / width_rear), and sending one fails the whole
       products query, so the rear selection can't be filtered server-side. */
    const filterObj: Record<string, string> = {
      width: selWidth,
      height: selHeight,
      rim: selRim,
    };
    router.push(
      `${dest}?${appendCategory(buildFilterParams(filterObj, [...SIZE_FIELDS]))}`
    );
  };

  const handleVehicleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    /* The vehicle itself is not filterable — no product carries vehicle/model,
       and `year` is the tyre's production year. The trim's fitment size is what
       filters the catalog. */
    if (!selSize) return;
    const dest = basePath ?? tyresBase;
    router.push(
      `${dest}?${appendCategory(
        buildFilterParams(
          { width: selSize.width, height: selSize.height, rim: selSize.rim },
          [...SIZE_FIELDS]
        )
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
    router.push(
      `${dest}?${appendCategory(
        buildFilterParams(
          { width: s.width, height: s.height, rim: s.rim },
          [...SIZE_FIELDS]
        )
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
                  className="relative w-full max-w-[760px] h-[580px] sm:h-[610px] max-h-[90vh] bg-white rounded-[22px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Find tyres by size"
                >
                  {/* ── RED HEADER ── */}
                  <div
                    className="text-white p-[20px_20px_10px] relative rounded-t-[22px] flex-shrink-0"
                    style={{ background: "linear-gradient(#D52D27 0%, #D52D27 55%, #D52D27 100%)" }}
                  >
                    {/* Top Close Button */}
                    <button
                      type="button"
                      className="absolute top-3 right-4 text-white/90 hover:text-white hover:scale-110 transition-transform p-1 cursor-pointer z-10"
                      onClick={closeSize}
                      aria-label="Close"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>

                    {/* Top Row: Title + Current Selection badge */}
                    <div className="flex items-start justify-between gap-2 mb-3.5">
                      <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-white leading-tight m-0 tracking-tight">
                          {sizeStep === "summary" ? "Ready to search!" : "What size are your tyres?"}
                        </h4>
                        <p className="text-white/85 text-xs sm:text-[13px] font-normal mt-1 mb-0 leading-relaxed">
                          {sizeStep === "summary"
                            ? "Your selected tyre size."
                            : sizeStep === "width"
                            ? "Pick the width — it's the first number on your sidewall (e.g. 235)."
                            : sizeStep === "height"
                            ? "Now the aspect ratio (height) — the second number (e.g. 40)."
                            : "Finally, the rim diameter in inches (e.g. R20)."}
                        </p>
                      </div>

                      {/* Current Selection Box */}
                      <div className="bg-[#851214] rounded-lg px-4 py-2 text-center min-w-[130px] border border-white/10 shrink-0 mt-4">
                        {!hasRearTyre ? (
                          <>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-white/70 block leading-tight">
                              CURRENT SELECTION
                            </span>
                            <span className="text-sm font-bold text-white tracking-widest block mt-0.5 leading-tight font-sans">
                              {frontFormatted}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[8px] uppercase font-bold tracking-wider text-white/70 block leading-tight">
                              FRONT SIZE
                            </span>
                            <span className="text-xs font-bold text-white block mt-0.5 leading-tight font-sans">
                              {frontFormatted}
                            </span>
                            <div className="border-t border-white/20 my-0.5" />
                            <span className="text-[8px] uppercase font-bold tracking-wider text-white/70 block leading-tight">
                              REAR
                            </span>
                            <span className="text-xs font-bold text-white block mt-0.5 leading-tight font-sans">
                              {rearFormatted}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Step Tabs Row (WIDTH / HEIGHT / RIM) */}
                    <div className="grid grid-cols-3 gap-3.5 mt-4">
                      {/* Width Tab */}
                      {(() => {
                        const isDone = Boolean(currWidth) && sizeStep !== "width";
                        const isActive = sizeStep === "width";
                        return (
                          <div
                            className={`relative rounded-lg p-3 flex items-center gap-3 text-left transition-all cursor-pointer bg-white/10 border border-white/20 select-none hover:bg-white/15 ${
                              isActive ? "border-b-2 border-b-[#f4a923]" : ""
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isDone || isActive
                                  ? "bg-[#f4a923] text-white"
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
                              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                                WIDTH
                              </span>
                              <span
                                className={`text-xs sm:text-[14px] font-bold block leading-tight mt-0.5 truncate ${
                                  currWidth ? "text-[#f4a923]" : "text-white/70"
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
                            className={`relative rounded-lg p-3 flex items-center gap-3 text-left transition-all cursor-pointer select-none bg-white/10 border border-white/20 hover:bg-white/15 ${
                              isActive ? "border-b-2 border-b-[#f4a923]" : ""
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isDone || isActive
                                  ? "bg-[#f4a923] text-white"
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
                              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                                HEIGHT
                              </span>
                              <span
                                className={`text-xs sm:text-[14px] font-bold block leading-tight mt-0.5 truncate ${
                                  currHeight ? "text-[#f4a923]" : "text-white/70"
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
                            className={`relative rounded-lg p-3 flex items-center gap-3 text-left transition-all cursor-pointer select-none bg-white/10 border border-white/20 hover:bg-white/15 ${
                              isActive ? "border-b-2 border-b-[#f4a923]" : ""
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isDone || isActive
                                  ? "bg-[#f4a923] text-white"
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
                              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                                RIM
                              </span>
                              <span
                                className={`text-xs sm:text-[14px] font-bold block leading-tight mt-0.5 truncate ${
                                  currRim ? "text-[#f4a923]" : "text-white/70"
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
                          className={`px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            activeSizeTab === "front"
                              ? "bg-white text-[#d12729] shadow-sm"
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
                          className={`px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            activeSizeTab === "rear"
                              ? "bg-white text-[#d12729] shadow-sm"
                              : "border border-white/40 text-white hover:bg-white/10 font-semibold"
                          }`}
                        >
                          Rear Size
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── WHITE BODY ── */}
                  <div className="px-5 py-1 flex-1 overflow-y-auto finder-modal-scroll bg-white flex flex-col justify-start">
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
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <input
                            type="text"
                            placeholder={`Search ${activeSizeTab === "rear" ? "rear " : ""}${sizeStep}...`}
                            value={sizeQuery}
                            onChange={(e) => setSizeQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-all font-normal"
                          />
                        </div>

                        {/* Options List / Grid (Consistent button size across Width, Height, Rim) */}
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
                                  className={`w-[130px] h-[48px] border rounded-lg flex items-center justify-center text-center text-[15px] font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0 ${
                                    isSelected
                                      ? "border-2 border-[#d12729] text-[#d12729] bg-[#fff5f5] shadow-sm"
                                      : "border-gray-200 text-gray-900 bg-white hover:border-gray-400 hover:shadow-sm"
                                  }`}
                                >
                                  {o.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
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
                                  className={`w-full h-[48px] border rounded-lg flex items-center justify-center text-center text-[15px] font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                                    isSelected
                                      ? "border-2 border-[#d12729] text-[#d12729] bg-[#fff5f5] shadow-sm"
                                      : "border-gray-200 text-gray-900 bg-white hover:border-gray-400 hover:shadow-sm"
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
                      /* ── READY TO SEARCH / SUMMARY VIEW (Screenshot 3 & 4) ── */
                      <div className="py-2 text-center">
                        <h3 className="text-2xl sm:text-[26px] font-bold text-gray-900 mb-1 tracking-tight">
                          Ready to search!
                        </h3>
                        <p className="text-[13px] text-[#6c757d] mb-[10px] font-normal">
                          Your selected tyre size
                        </p>

                        {/* Selection Cards (Side-by-Side if Dual, Single Card if Single) */}
                        <div
                          className={`finder-summary-sizes flex justify-center gap-4 mb-[22px] mx-auto ${
                            hasRearTyre ? "max-w-2xl" : "max-w-md"
                          }`}
                        >
                          {/* Front Tyre Card */}
                          <div className="finder-summary-front text-left bg-[#fbfcfe] border border-[#ccc] rounded-[8px] p-[14px_18px_12px] w-full relative overflow-hidden shadow-none">
                            <div className="absolute -right-[30px] -top-[30px] bg-[#faf2e3] h-[96px] w-[96px] rounded-full pointer-events-none" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              {hasRearTyre ? "FRONT TYRES:" : "ALL TYRES"}
                            </span>
                            <div className="text-2xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight leading-none my-1 font-sans">
                              {frontFormatted}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSizeTab("front");
                                setSizeStep("width");
                              }}
                              className="text-xs font-bold uppercase tracking-wider text-[#d12729] hover:underline mt-2 inline-block cursor-pointer"
                            >
                              EDIT
                            </button>
                          </div>

                          {/* Rear Tyre Card (if enabled) */}
                          {hasRearTyre && (
                            <div className="finder-summary-rear text-left bg-[#fbfcfe] border border-[#ccc] rounded-[8px] p-[14px_18px_12px] w-full relative overflow-hidden shadow-none">
                              <div className="absolute -right-[30px] -top-[30px] bg-[#faf2e3] h-[96px] w-[96px] rounded-full pointer-events-none" />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                                REAR TYRES:
                              </span>
                              <div className="text-2xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight leading-none my-1 font-sans">
                                {rearFormatted}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSizeTab("rear");
                                  setSizeStep("width");
                                }}
                                className="text-xs font-bold uppercase tracking-wider text-[#d12729] hover:underline mt-2 inline-block cursor-pointer"
                              >
                                EDIT
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Add / Same Size Switcher Button (Dashed rounded-full) */}
                        <div className="flex justify-center mt-3 mb-1">
                          <button
                            type="button"
                            onClick={toggleRearMode}
                            className="border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-full py-2.5 px-6 inline-flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider text-gray-700 transition-all cursor-pointer select-none active:scale-95"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#d12729] text-white flex items-center justify-center text-xs font-bold shrink-0">
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
                  <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-b-[22px]">
                    <button
                      type="button"
                      className="text-sm font-bold text-gray-900 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className={`rounded-full px-8 py-2.5 sm:py-3 text-sm font-bold flex items-center gap-2 transition-all ${
                          currVal
                            ? "bg-[#8b9bb4] hover:bg-[#7789a3] text-white cursor-pointer shadow-sm active:scale-95"
                            : "bg-[#8b9bb4] text-white/80 opacity-60 cursor-not-allowed"
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
                        className="bg-black hover:bg-gray-900 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-full px-8 py-2.5 sm:py-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
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
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="absolute inset-0" onClick={closeVeh} />
                <div className="relative w-full max-w-[760px] h-[580px] sm:h-[610px] max-h-[90vh] bg-white rounded-[22px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                  {/* ── RED HEADER ── */}
                  <div
                    className="text-white p-[20px_20px_10px] relative rounded-t-[22px] flex-shrink-0"
                    style={{ background: "linear-gradient(#D52D27 0%, #D52D27 55%, #D52D27 100%)" }}
                  >
                    {/* Top Close Button */}
                    <button
                      type="button"
                      className="absolute top-3 right-4 text-white/90 hover:text-white hover:scale-110 transition-transform p-1 cursor-pointer z-10"
                      onClick={closeVeh}
                      aria-label="Close"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>

                    <div className="flex items-start justify-between gap-2 mb-3.5">
                      {/* Left: Titles */}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight m-0">
                          {vehStep === "summary"
                            ? "Ready to search!"
                            : "Which vehicle are you looking for?"}
                        </h2>
                        <p className="text-white/85 text-xs sm:text-[13px] font-normal mt-1 mb-0 leading-relaxed">
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

                      {/* Right: CURRENT SELECTION Badge */}
                      <div className="bg-[#851214] border border-white/10 rounded-lg px-4 py-2 text-center min-w-[130px] shrink-0 mt-4">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 block leading-tight">
                          CURRENT SELECTION
                        </span>
                        <span className="text-sm font-bold text-white block leading-tight mt-0.5 max-w-[220px] truncate">
                          {vehFormatted}
                        </span>
                      </div>
                    </div>

                    {/* ── 4 STEP TABS ROW (Make / Model / Year / Engine) ── */}
                    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mt-4">
                      {/* Step 1: Make */}
                      {(() => {
                        const isDone = Boolean(selVehicle) && vehStep !== "vehicle";
                        const isActive = vehStep === "vehicle";
                        return (
                          <div
                            className={`relative rounded-lg p-3 flex items-center gap-3 text-left transition-all cursor-pointer bg-white/10 border border-white/20 select-none hover:bg-white/15 ${
                              isActive ? "border-b-2 border-b-[#f4a923]" : ""
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isDone || isActive
                                  ? "bg-[#f4a923] text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <Car size={18} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                                MAKE
                              </span>
                              <span
                                className={`text-xs sm:text-[14px] font-bold block leading-tight mt-0.5 truncate ${
                                  selVehicle ? "text-[#f4a923]" : "text-white/70"
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
                            className={`relative rounded-lg p-3 flex items-center gap-3 text-left transition-all cursor-pointer select-none bg-white/10 border border-white/20 hover:bg-white/15 ${
                              isActive ? "border-b-2 border-b-[#f4a923]" : ""
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isDone || isActive
                                  ? "bg-[#f4a923] text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <Layers size={18} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                                MODEL
                              </span>
                              <span
                                className={`text-xs sm:text-[14px] font-bold block leading-tight mt-0.5 truncate ${
                                  selModel ? "text-[#f4a923]" : "text-white/70"
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
                            className={`relative rounded-lg p-3 flex items-center gap-3 text-left transition-all cursor-pointer select-none bg-white/10 border border-white/20 hover:bg-white/15 ${
                              isActive ? "border-b-2 border-b-[#f4a923]" : ""
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isDone || isActive
                                  ? "bg-[#f4a923] text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <Calendar size={18} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                                YEAR
                              </span>
                              <span
                                className={`text-xs sm:text-[14px] font-bold block leading-tight mt-0.5 truncate ${
                                  selYear ? "text-[#f4a923]" : "text-white/70"
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
                            className={`relative rounded-lg p-3 flex items-center gap-3 text-left transition-all cursor-pointer select-none bg-white/10 border border-white/20 hover:bg-white/15 ${
                              isActive ? "border-b-2 border-b-[#f4a923]" : ""
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isDone || isActive
                                  ? "bg-[#f4a923] text-white"
                                  : "bg-white/15 text-white/70"
                              }`}
                            >
                              {isDone ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <Gauge size={18} strokeWidth={2.5} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                                ENGINE
                              </span>
                              <span
                                className={`text-xs sm:text-[14px] font-bold block leading-tight mt-0.5 truncate ${
                                  selEngine ? "text-[#f4a923]" : "text-white/70"
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
                  <div className="px-5 py-3 flex-1 overflow-y-auto finder-modal-scroll bg-white flex flex-col justify-start">
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
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <input
                            type="text"
                            placeholder="Search here ..."
                            value={vehQuery}
                            onChange={(e) => setVehQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-all font-normal"
                          />
                          {vehQuery && (
                            <button
                              type="button"
                              onClick={() => setVehQuery("")}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>

                        {/* Step 1: Make Grid */}
                        {vehStep === "vehicle" && (() => {
                          const opts = vehFilter(meta.vehicle ?? []);
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                              {opts.map((o) => {
                                const isSelected = selVehicle === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => pickVehicle(o.value)}
                                    className={`border rounded-lg p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer h-[100px] w-full text-center ${
                                      isSelected
                                        ? "border-2 border-[#d12729] text-[#d12729] bg-[#fff5f5] shadow-sm"
                                        : "border-gray-200 text-gray-900 bg-white hover:border-gray-400 hover:shadow-sm"
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                              {opts.map((o) => {
                                const isSelected = selModel === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => pickModel(o.value)}
                                    className={`w-full h-[48px] border rounded-lg flex items-center justify-center text-center text-sm font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer px-3 ${
                                      isSelected
                                        ? "border-2 border-[#d12729] text-[#d12729] bg-[#fff5f5] shadow-sm"
                                        : "border-gray-200 text-gray-900 bg-white hover:border-gray-400 hover:shadow-sm"
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
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                              {opts.map((o) => {
                                const isSelected = selYear === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => pickYear(o.value)}
                                    className={`w-full h-[48px] border rounded-lg flex items-center justify-center text-center text-[15px] font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                                      isSelected
                                        ? "border-2 border-[#d12729] text-[#d12729] bg-[#fff5f5] shadow-sm"
                                        : "border-gray-200 text-gray-900 bg-white hover:border-gray-400 hover:shadow-sm"
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

                        {/* Step 4: Engine + Sizes Combined View (Screenshot layout) */}
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
                                  <h4 className="text-center font-extrabold text-base sm:text-lg text-black mb-3.5">
                                    {fuel === "Trims" || fuel === "Other" ? "Petrol" : fuel}
                                  </h4>

                                  {/* Centered Engine Options Pills */}
                                  <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                                    {engs.map((o) => {
                                      const isSelected = selEngine === o.value;
                                      const cleanLabel = o.label.replace(/\s*\d+\s*hp/i, "").trim();
                                      const hpVal = o.hp || o.label.match(/(\d+)\s*hp/i)?.[1];
                                      return (
                                        <button
                                          key={o.value}
                                          type="button"
                                          onClick={() => setSelEngine(o.value)}
                                          className={`px-6 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer select-none active:scale-95 ${
                                            isSelected
                                              ? "border-gray-800 text-black bg-white shadow-sm ring-1 ring-black"
                                              : "border-gray-200 text-gray-800 bg-white hover:border-gray-400"
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
                                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                                      {displaySizes.map((s) => {
                                        const isSelected = selSize?.label === s.label && selSize?.rearLabel === s.rearLabel;
                                        const rimVal = s.rim ? (s.rim.includes('"') ? s.rim : `${s.rim}"`) : "";
                                        const frontText = rimVal ? `${rimVal} | ${s.label}` : s.label;
                                        const rearRimVal = s.rear?.rim ? (s.rear.rim.includes('"') ? s.rear.rim : `${s.rear.rim}"`) : "";
                                        const rearText = rearRimVal ? `${rearRimVal} | ${s.rearLabel}` : s.rearLabel;

                                        return (
                                          <button
                                            key={`${s.label}-${s.rearLabel ?? ""}`}
                                            type="button"
                                            onClick={() => pickSize(s)}
                                            className={`relative border rounded-lg p-3.5 pt-4 min-w-[155px] text-center cursor-pointer transition-all hover:shadow-md active:scale-95 ${
                                              isSelected
                                                ? "border-2 border-[#d12729] bg-[#fff5f5] shadow-sm"
                                                : "border-gray-200 bg-white hover:border-gray-400"
                                            }`}
                                          >
                                            {/* Red FACTORY SIZE / OPTIONAL SIZE tag */}
                                            <span className="absolute -top-2.5 left-2 bg-[#d12729] text-white text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wider shadow-sm">
                                              {s.isFactory ? "FACTORY SIZE" : "OPTIONAL SIZE"}
                                            </span>
                                            <span className="text-sm font-bold text-gray-900 block mt-1">
                                              {frontText}
                                            </span>
                                            {s.rearLabel && (
                                              <span className="text-[11px] font-semibold text-gray-500 block mt-0.5">
                                                Rear: {rearText}
                                              </span>
                                            )}
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
                                  <p className="text-center text-xs italic text-gray-700 mt-8 max-w-xl mx-auto leading-relaxed">
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
                      <div className="py-2 text-center">
                        <h3 className="text-2xl sm:text-[26px] font-bold text-gray-900 mb-1 tracking-tight">
                          Ready to search!
                        </h3>
                        <p className="text-[13px] text-[#6c757d] mb-[10px] font-normal">
                          Your selected vehicle
                        </p>

                        <div className="finder-summary-sizes flex justify-center gap-4 mb-[22px] mx-auto max-w-md">
                          <div className="finder-summary-front text-left bg-[#fbfcfe] border border-[#ccc] rounded-[8px] p-[14px_18px_12px] w-full relative overflow-hidden shadow-none">
                            <div className="absolute -right-[30px] -top-[30px] bg-[#faf2e3] h-[96px] w-[96px] rounded-full pointer-events-none" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              SELECTED VEHICLE:
                            </span>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight my-1">
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
                              <div className="text-sm font-semibold text-gray-600 mt-1">
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
                            <button
                              type="button"
                              onClick={() => {
                                setVehStep("engine");
                              }}
                              className="text-xs font-bold uppercase tracking-wider text-[#d12729] hover:underline mt-2 inline-block cursor-pointer"
                            >
                              EDIT
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── FOOTER ── */}
                  <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-b-[22px]">
                    <button
                      type="button"
                      className="text-sm font-bold text-gray-900 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className={`rounded-full px-8 py-2.5 sm:py-3 text-sm font-bold flex items-center gap-2 transition-all ${
                          currVehVal
                            ? "bg-[#8b9bb4] hover:bg-[#7789a3] text-white cursor-pointer shadow-sm active:scale-95"
                            : "bg-[#8b9bb4] text-white/80 opacity-60 cursor-not-allowed"
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
                        className="bg-black hover:bg-gray-900 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-full px-8 py-2.5 sm:py-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
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
