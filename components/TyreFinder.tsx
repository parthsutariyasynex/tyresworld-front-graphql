"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { X, Search, ArrowLeft } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";
import { buildFilterParams } from "@/lib/filterBuilder";

/* ── types ───────────────────────────────────────────────────────── */
type AttrOption = { label: string; value: string; fuel?: string | null; hp?: number | null };
type Aggs = Record<string, AttrOption[]>;
type Tab = "size" | "vehicle";
type SizeStep = "width" | "height" | "rim";
type VehStep = "vehicle" | "model" | "year" | "engine";

interface TyreFinderProps {
  locale?: string;
  categoryUid?: string;
  basePath?: string;
}

const SIZE_FIELDS = ["width", "height", "rim"] as const;
const VEHICLE_FIELDS = ["vehicle", "model", "year"] as const;

function sortSizeOpts(opts: AttrOption[]): AttrOption[] {
  return [...opts].sort((a, b) => {
    const na = parseFloat(a.label), nb = parseFloat(b.label);
    return !isNaN(na) && !isNaN(nb) ? na - nb : a.label.localeCompare(b.label);
  });
}

function getVehicleLogo(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${slug}.png`;
}

/* ────────────────────────────────────────────────────────────────── */
export default function TyreFinder({ locale: localeProp, categoryUid, basePath }: TyreFinderProps) {
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
  const [selVehicle, setSelVehicle] = useState("");
  const [selModel, setSelModel] = useState("");
  const [selYear, setSelYear] = useState("");
  const [selEngine, setSelEngine] = useState("");

  /* ── dependent child options ───────────────────────────────────── */
  const [childHeights, setChildHeights] = useState<AttrOption[] | null>(null);
  const [childRims, setChildRims] = useState<AttrOption[] | null>(null);
  const [childModels, setChildModels] = useState<AttrOption[] | null>(null);
  const [childYears, setChildYears] = useState<AttrOption[] | null>(null);
  const [childEngines, setChildEngines] = useState<AttrOption[] | null>(null);
  const [depLoading, setDepLoading] = useState(false);

  /* ── UI state ──────────────────────────────────────────────────── */
  const [tab, setTab] = useState<Tab>("size");
  const [sizeOpen, setSizeOpen] = useState(false);
  const [sizeStep, setSizeStep] = useState<SizeStep>("width");
  const [vehOpen, setVehOpen] = useState(false);
  const [vehStep, setVehStep] = useState<VehStep>("vehicle");
  const [vehQuery, setVehQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isHome = pathname === "/" || pathname === "/en" || pathname === "/ar" || pathname === "/en/" || pathname === "/ar/";
      if (!isHome) {
        setIsSticky(window.scrollY > 100);
        return;
      }
      const threshold = Math.max(100, (window.innerWidth * 0.338) - 70);
      setIsSticky(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const sizeAbortRef = useRef<AbortController | null>(null);
  const vehAbortRef = useRef<AbortController | null>(null);

  useScrollLock(sizeOpen || vehOpen);

  /* ── reset selections on pathname change ──────────────────────── */
  useEffect(() => {
    setSelWidth("");
    setSelHeight("");
    setSelRim("");
    setSelVehicle("");
    setSelModel("");
    setSelYear("");
    setSelEngine("");
    setSizeStep("width");
    setVehStep("vehicle");
    setVehQuery("");
    setChildHeights(null);
    setChildRims(null);
    setChildModels(null);
    setChildYears(null);
    setChildEngines(null);
  }, [pathname]);

  /* ── load vehicle / model / year / brand from customAttributeMetadataV2 */
  useEffect(() => {
    fetch("/api/tyre-finder")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, AttrOption[]> = {};
        for (const attr of d.attributes ?? []) {
          if (attr.attribute_code === "width" || attr.attribute_code === "height" || attr.attribute_code === "rim") continue;
          map[attr.attribute_code] = attr.attribute_options ?? [];
        }
        setMeta(map);
        setMetaLoad(false);
      })
      .catch(() => setMetaLoad(false));
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

  /* ── fetch vehicle / model / year options from aggregations ─────── */
  const fetchVehDep = useCallback(
    async (params: Record<string, string>): Promise<Aggs> => {
      vehAbortRef.current?.abort();
      const ctrl = new AbortController();
      vehAbortRef.current = ctrl;
      const qs = new URLSearchParams(params).toString();
      const r = await fetch(`/api/tyre-finder/options?${qs}`, { signal: ctrl.signal });
      const d = await r.json();
      return d.aggregations ?? {};
    },
    []
  );

  /* ── load initial widths on mount / when category changes ──────── */
  useEffect(() => {
    setWidthLoad(true);
    const params: Record<string, string> = {};
    if (categoryUid) params.category_uid = categoryUid;
    fetchSizeAggs(params)
      .then((aggs) => { setWidths(sortSizeOpts(aggs.width ?? [])); setWidthLoad(false); })
      .catch((e) => { if (e.name !== "AbortError") setWidthLoad(false); });
  }, [categoryUid, fetchSizeAggs]);

  /* ── width selected → fetch available heights ──────────────────── */
  useEffect(() => {
    if (!selWidth) {
      setChildHeights(null); setSelHeight("");
      setChildRims(null); setSelRim("");
      return;
    }
    setDepLoading(true);
    const params: Record<string, string> = { width: selWidth };
    if (categoryUid) params.category_uid = categoryUid;
    fetchSizeAggs(params)
      .then((aggs) => { const h = sortSizeOpts(aggs.height ?? []); setChildHeights(h.length ? h : null); setDepLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
  }, [selWidth, categoryUid, fetchSizeAggs]);

  /* ── width + height selected → fetch available rims ───────────── */
  useEffect(() => {
    if (!selWidth || !selHeight) {
      setChildRims(null); setSelRim("");
      return;
    }
    setDepLoading(true);
    const params: Record<string, string> = { width: selWidth, height: selHeight };
    if (categoryUid) params.category_uid = categoryUid;
    fetchSizeAggs(params)
      .then((aggs) => { const r = sortSizeOpts(aggs.rim ?? []); setChildRims(r.length ? r : null); setDepLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
  }, [selWidth, selHeight, categoryUid, fetchSizeAggs]);

  /* ── vehicle selected → fetch available models via Wheel API ─────── */
  useEffect(() => {
    if (!selVehicle) {
      setChildModels(null); setSelModel("");
      setChildYears(null); setSelYear("");
      return;
    }
    const vehicleLabel = labelFor("vehicle", selVehicle);
    if (!vehicleLabel || vehicleLabel === selVehicle) {
      return;
    }
    setDepLoading(true);
    fetchVehDep({ vehicle: selVehicle, vehicleLabel, ...catParam })
      .then((aggs) => { setChildModels(aggs.model ?? null); setDepLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selVehicle, fetchVehDep, meta]);

  /* ── vehicle + model selected → fetch available years via Wheel API ─ */
  useEffect(() => {
    if (!selVehicle || !selModel) {
      setChildYears(null); setSelYear("");
      setChildEngines(null); setSelEngine("");
      return;
    }
    const vehicleLabel = labelFor("vehicle", selVehicle);
    if (!vehicleLabel || vehicleLabel === selVehicle) {
      return;
    }
    setDepLoading(true);
    fetchVehDep({ vehicle: selVehicle, vehicleLabel, model: selModel, ...catParam })
      .then((aggs) => { setChildYears(aggs.year ?? null); setDepLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selVehicle, selModel, fetchVehDep, meta]);

  /* ── vehicle + model + year selected → fetch engine modifications ─── */
  useEffect(() => {
    if (!selVehicle || !selModel || !selYear) {
      setChildEngines(null); setSelEngine("");
      return;
    }
    const vehicleLabel = labelFor("vehicle", selVehicle);
    if (!vehicleLabel || vehicleLabel === selVehicle) {
      return;
    }
    setDepLoading(true);
    fetchVehDep({ vehicle: selVehicle, vehicleLabel, model: selModel, year: selYear, ...catParam })
      .then((aggs) => { setChildEngines(aggs.engine ?? null); setDepLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setDepLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selVehicle, selModel, selYear, fetchVehDep, meta]);

  /* ── displayed lists ───────────────────────────────────────────── */
  const displayHeights = childHeights ?? [];
  const displayRims = childRims ?? [];
  const displayModels = childModels ?? meta.model ?? [];
  const displayYears = childYears ?? meta.year ?? [];
  const displayEngines = childEngines ?? [];

  /* ── label lookup ──────────────────────────────────────────────── */
  const labelFor = (code: string, value: string): string => {
    let source: AttrOption[];
    if (code === "width") source = widths;
    else if (code === "height") source = childHeights ?? [];
    else if (code === "rim") source = childRims ?? [];
    else if (code === "engine") source = childEngines ?? [];
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
    router.push(`${dest}?${appendCategory(buildFilterParams(
      { width: selWidth, height: selHeight, rim: selRim }, [...SIZE_FIELDS]
    ))}`);
  };

  const handleVehicleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selVehicle) return;
    const dest = basePath ?? tyresBase;
    router.push(`${dest}?${appendCategory(buildFilterParams(
      { vehicle: selVehicle, model: selModel, year: selYear }, [...VEHICLE_FIELDS]
    ))}`);
  };

  /* ── size modal helpers ────────────────────────────────────────── */
  const openSize = (step: SizeStep) => {
    setSizeStep(step);
    setSizeOpen(true);
    if (step === "width") {
      // Re-fetch widths every time the Width popup opens so the loader is visible
      setWidthLoad(true);
      const params: Record<string, string> = {};
      if (categoryUid) params.category_uid = categoryUid;
      fetchSizeAggs(params)
        .then((aggs) => { setWidths(sortSizeOpts(aggs.width ?? [])); setWidthLoad(false); })
        .catch((e) => { if (e.name !== "AbortError") setWidthLoad(false); });
    }
  };

  const pickWidth = (v: string) => {
    if (selWidth === v) { setSelWidth(""); setSizeStep("width"); }
    else { setSelWidth(v); setSizeStep("height"); }
  };
  const pickHeight = (v: string) => {
    if (selHeight === v) { setSelHeight(""); setSizeStep("height"); }
    else { setSelHeight(v); setSizeStep("rim"); }
  };
  const pickRim = (v: string) => { setSelRim(selRim === v ? "" : v); };

  const handleBack = () => {
    if (sizeStep === "rim") { setSelHeight(""); setSizeStep("height"); }
    else if (sizeStep === "height") { setSelWidth(""); setSizeStep("width"); }
  };

  const closeSize = () => {
    setSizeOpen(false);
    setSelWidth("");
    setSelHeight("");
    setSelRim("");
    setSizeStep("width");
    setChildHeights(null);
    setChildRims(null);
  };

  /* ── vehicle modal helpers ─────────────────────────────────────── */
  const openVeh = (step: VehStep) => {
    setVehStep(step);
    setVehQuery("");
    setVehOpen(true);
    if (step === "vehicle") {
      // Re-fetch vehicle meta every time the Make popup opens so the loader is visible
      setMetaLoad(true);
      fetch("/api/tyre-finder")
        .then((r) => r.json())
        .then((d) => {
          const map: Record<string, AttrOption[]> = {};
          for (const attr of d.attributes ?? []) {
            if (attr.attribute_code === "width" || attr.attribute_code === "height" || attr.attribute_code === "rim") continue;
            map[attr.attribute_code] = attr.attribute_options ?? [];
          }
          setMeta(map);
          setMetaLoad(false);
        })
        .catch(() => setMetaLoad(false));
    }
  };

  const pickVehicle = (v: string) => {
    setSelVehicle(v); setSelModel(""); setSelYear(""); setSelEngine("");
    setVehQuery(""); setVehStep("model");
  };
  const pickModel = (v: string) => {
    setSelModel(v); setSelYear(""); setSelEngine("");
    setVehQuery(""); setVehStep("year");
  };
  const pickYear = (v: string) => {
    setSelYear(v); setSelEngine("");
    setVehQuery(""); setVehStep("engine");
  };
  const pickEngine = (v: string) => {
    setSelEngine(v);
    setVehQuery("");
  };

  const handleVehBack = () => {
    if (selVehicle && selModel && selYear && selEngine) {
      setSelEngine("");
      setVehStep("engine");
    } else if (vehStep === "engine") {
      setSelYear("");
      setVehStep("year");
    } else if (vehStep === "year") {
      setSelModel("");
      setVehStep("model");
    } else if (vehStep === "model") {
      setSelVehicle("");
      setVehStep("vehicle");
    }
  };

  const closeVeh = () => {
    setVehOpen(false);
    setSelVehicle("");
    setSelModel("");
    setSelYear("");
    setSelEngine("");
    setVehQuery("");
    setVehStep("vehicle");
    setChildModels(null);
    setChildYears(null);
    setChildEngines(null);
  };

  const vehFilter = (opts: AttrOption[]) =>
    vehQuery ? opts.filter((o) => o.label.toLowerCase().includes(vehQuery.toLowerCase())) : opts;

  /* ── shared styles ─────────────────────────────────────────────── */
  const fieldBtn =
    "w-full bg-transparent text-black font-normal text-[13px] outline-none cursor-pointer flex items-center justify-between";
  const optBtn = (active: boolean) =>
    `border py-3.5 rounded-xl text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${active
      ? "bg-black text-white border-black"
      : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"
    }`;

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div
      className="tyre-search-sticky-wrapper"
      style={isSticky ? { height: 64 } : undefined}
    >
      <section
        id="search"
        className={`search-wrap tyreform ${isSticky ? "sticky" : ""}`}
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
                    <div className="flex items-center w-full h-full">

                      <div className="search-field-wrap">
                        <button type="button" onClick={() => openSize("width")} className={fieldBtn}>
                          <span className="text-black">
                            {selWidth ? labelFor("width", selWidth) : "Width"}
                          </span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>

                      <div className="search-divider" />

                      <div className="search-field-wrap">
                        <button type="button" disabled={!selWidth} onClick={() => openSize("height")} className={`${fieldBtn} disabled:opacity-40`}>
                          <span className="text-black">
                            {selHeight ? labelFor("height", selHeight) : "Height"}
                          </span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>

                      <div className="search-divider" />

                      <div className="search-field-wrap">
                        <button type="button" disabled={!selHeight} onClick={() => openSize("rim")} className={`${fieldBtn} disabled:opacity-40`}>
                          <span className="text-black">
                            {selRim ? `R${labelFor("rim", selRim)}` : "Rim"}
                          </span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>

                    </div>
                  )}

                  {/* ── Vehicle tab ────────────────────────────── */}
                  {tab === "vehicle" && (
                    <div className="flex items-center w-full h-full">

                      <div className="search-field-wrap">
                        <button type="button" disabled={metaLoading} onClick={() => openVeh("vehicle")} className={fieldBtn}>
                          <span className="text-black">
                            {selVehicle ? labelFor("vehicle", selVehicle) : "Make"}
                          </span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>

                      <div className="search-divider" />

                      <div className="search-field-wrap">
                        <button type="button" disabled={!selVehicle || depLoading} onClick={() => openVeh("model")} className={`${fieldBtn} disabled:opacity-40`}>
                          <span className="text-black">
                            {selModel ? labelFor("model", selModel) : "Model"}
                          </span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>

                      <div className="search-divider" />

                      <div className="search-field-wrap">
                        <button type="button" disabled={!selModel || depLoading} onClick={() => openVeh("year")} className={`${fieldBtn} disabled:opacity-40`}>
                          <span className="text-black">
                            {selYear ? labelFor("year", selYear) : "Year"}
                          </span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>

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
          {sizeOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="absolute inset-0" onClick={closeSize} />
              <div className="relative w-full max-w-[760px] max-h-[85vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <h3 className="text-[17px] font-semibold text-ink">
                    Current Selection:&nbsp;
                    {selWidth || selHeight || selRim ? (
                      <span className="text-[#ed1c24] font-extrabold font-mono ml-1">
                        {selWidth ? labelFor("width", selWidth) : "—"} /{" "}
                        {selHeight ? labelFor("height", selHeight) : "—"}&nbsp;
                        {selRim ? `R${labelFor("rim", selRim)}` : "—"}
                      </span>
                    ) : (
                      <span className="text-ink/40 font-medium ml-1">—</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3">
                    {sizeStep !== "width" && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="w-8 h-8 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] flex items-center justify-center text-white transition-all hover:scale-105"
                        aria-label="Back"
                      >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                      </button>
                    )}
                    {(selWidth || selHeight || selRim) && (
                      <button
                        type="button"
                        onClick={() => { setSelWidth(""); setSelHeight(""); setSelRim(""); setSizeStep("width"); }}
                        className="text-xs font-bold text-[#ed1c24] hover:underline"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeSize}
                      className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center text-white transition-all hover:scale-105"
                      aria-label="Close"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Step tabs */}
                <div className="grid grid-cols-3 w-full border-b border-gray-100">
                  {(["width", "height", "rim"] as SizeStep[]).map((s, i) => {
                    return (
                      <div
                        key={s}
                        className={`py-3 text-center font-bold text-sm text-white select-none ${sizeStep === s ? "bg-black" : "bg-[#ed1c24]"
                          }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </div>
                    );
                  })}
                </div>

                {/* Options */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  {(depLoading || (sizeStep === "width" && widthLoading)) ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/loader-style1.svg"
                        alt="Loading"
                        width={60}
                        height={60}
                        style={{ display: "block" }}
                      />

                    </div>
                  ) : (
                    <>
                      {sizeStep === "width" && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {widths.map((o) => (
                            <button key={o.value} type="button" onClick={() => pickWidth(o.value)} className={optBtn(selWidth === o.value)}>
                              {o.label}
                            </button>
                          ))}
                          {widths.length === 0 && (
                            <p className="col-span-full py-8 text-center text-ink/40 text-sm">No width options available.</p>
                          )}
                        </div>
                      )}
                      {sizeStep === "height" && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {displayHeights.map((o) => (
                            <button key={o.value} type="button" onClick={() => pickHeight(o.value)} className={optBtn(selHeight === o.value)}>
                              {o.label}
                            </button>
                          ))}
                          {displayHeights.length === 0 && (
                            <p className="col-span-full py-8 text-center text-ink/40 text-sm">No height options for this width.</p>
                          )}
                        </div>
                      )}
                      {sizeStep === "rim" && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {displayRims.map((o) => (
                            <button key={o.value} type="button" onClick={() => pickRim(o.value)} className={optBtn(selRim === o.value)}>
                              R{o.label}
                            </button>
                          ))}
                          {displayRims.length === 0 && (
                            <p className="col-span-full py-8 text-center text-ink/40 text-sm">No rim options for this size.</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    disabled={!selWidth}
                    onClick={() => {
                      setSizeOpen(false);
                      handleSizeSearch({ preventDefault: () => { } } as React.FormEvent);
                    }}
                    className="bg-[#ed1c24] hover:bg-[#c6181d] text-white font-black text-xs uppercase tracking-widest py-3 px-8 rounded-xl transition-colors disabled:opacity-40"
                  >
                    Find Tyres
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
          VEHICLE MODAL
      ════════════════════════════════════════════════════════════ */}
          {vehOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="absolute inset-0" onClick={closeVeh} />
              <div className="relative w-full max-w-[760px] max-h-[85vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
                  <h3 className="text-[17px] font-semibold text-ink">
                    Current Vehicle Selection :&nbsp;
                    {selVehicle || selModel || selYear || selEngine ? (
                      <span className="text-[#ed1c24] font-extrabold font-mono ml-1">
                        {selVehicle ? labelFor("vehicle", selVehicle) : "—"} /{" "}
                        {selModel ? labelFor("model", selModel) : "—"} /{" "}
                        {selYear ? labelFor("year", selYear) : "—"} /{" "}
                        {selEngine ? labelFor("engine", selEngine) : "—"}
                      </span>
                    ) : (
                      <span className="text-ink/40 font-medium ml-1">—</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3">
                    {(vehStep !== "vehicle" || selVehicle) && (
                      <button
                        type="button"
                        onClick={handleVehBack}
                        className="w-8 h-8 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] flex items-center justify-center text-white transition-all hover:scale-105"
                        aria-label="Back"
                      >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                      </button>
                    )}
                    {(selVehicle || selModel || selYear || selEngine) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelVehicle("");
                          setSelModel("");
                          setSelYear("");
                          setSelEngine("");
                          setVehStep("vehicle");
                        }}
                        className="text-xs font-bold text-[#ed1c24] hover:underline"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeVeh}
                      className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center text-white transition-all hover:scale-105"
                      aria-label="Close"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Step tabs */}
                <div className="grid grid-cols-4 w-full border-b border-gray-100 flex-shrink-0">
                  {(["vehicle", "model", "year", "engine"] as VehStep[]).map((s, i) => {
                    const isActive = vehStep === s;
                    let tabBg = "bg-[#ed1c24]";
                    if (isActive) {
                      tabBg = "bg-black";
                    }

                    const label =
                      s === "vehicle"
                        ? "Make"
                        : s === "engine"
                          ? "Engine"
                          : s.charAt(0).toUpperCase() + s.slice(1);

                    return (
                      <div
                        key={s}
                        className={`py-3.5 text-center font-bold text-sm text-white select-none ${tabBg}`}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>

                {/* Search input */}
                {(vehStep === "vehicle" || vehStep === "model" || vehStep === "engine") && (
                  <div className="px-6 pt-5 pb-2 bg-white flex-shrink-0">
                    <div className="flex items-center bg-white rounded-xl px-4 py-2.5 border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] focus-within:border-gray-400 transition-colors">
                      <input
                        type="text"
                        value={vehQuery}
                        onChange={(e) => setVehQuery(e.target.value)}
                        placeholder="Search here..."
                        className="bg-transparent text-sm text-ink outline-none flex-1 placeholder:text-gray-400 font-medium"
                      />
                      {vehQuery && (
                        <button type="button" onClick={() => setVehQuery("")} className="text-gray-400 hover:text-ink">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Options */}
                <div className={`p-6 overflow-y-auto flex-1 custom-scrollbar ${(selVehicle && selModel && selYear && selEngine) ? "flex flex-col justify-center" : ""
                  }`}>
                  {(depLoading || (vehStep === "vehicle" && metaLoading)) ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/loader-style1.svg"
                        alt="Loading"
                        width={60}
                        height={60}
                        style={{ display: "block" }}
                      />

                    </div>
                  ) : (selVehicle && selModel && selYear && selEngine) ? (
                    <div className="flex flex-col items-center justify-center py-4 w-full">
                      <div className="border border-gray-200 rounded-[18px] p-8 max-w-md w-full text-center flex flex-col items-center gap-5 bg-white shadow-sm">
                        <h4 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-gray-900">
                          VEHICLE SELECTION
                        </h4>
                        <p className="text-[14px] text-gray-600 font-bold">
                          All Tyres&nbsp;
                          <span className="font-extrabold font-mono text-black text-lg ml-1">
                            {labelFor("vehicle", selVehicle)} / {labelFor("model", selModel)} / {labelFor("year", selYear)} / {labelFor("engine", selEngine)}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setVehOpen(false);
                            handleVehicleSearch({ preventDefault: () => { } } as React.FormEvent);
                          }}
                          className="bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-wider py-3 px-10 rounded-md transition-all hover:scale-105 active:scale-95 shadow-md min-w-[130px]"
                        >
                          Search
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVehOpen(false);
                            handleVehicleSearch({ preventDefault: () => { } } as React.FormEvent);
                          }}
                          className="bg-[#ed1c24] hover:bg-[#c6181d] text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-md transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5"
                        >
                          <span>+</span> ADD DIFFERENT REAR TYRE SIZE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      {vehStep === "vehicle" && (() => {
                        const opts = vehFilter(meta.vehicle ?? []);
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {opts.map((o) => (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => pickVehicle(o.value)}
                                className="bg-white border border-gray-200 rounded-[20px] p-4 flex flex-col items-center justify-center gap-3 hover:border-black hover:shadow-md transition-all h-[120px] w-full"
                              >
                                <div className="h-12 w-full flex items-center justify-center">
                                  <img
                                    src={getVehicleLogo(o.label)}
                                    alt={o.label}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-gray-900 text-center line-clamp-1">
                                  {o.label}
                                </span>
                              </button>
                            ))}
                            {opts.length === 0 && (
                              <p className="col-span-full py-8 text-center text-ink/40 text-sm">
                                {vehQuery ? `No makes matching "${vehQuery}".` : "No makes available."}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {vehStep === "model" && (() => {
                        const opts = vehFilter(displayModels);
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {opts.map((o) => (
                              <button key={o.value} type="button" onClick={() => pickModel(o.value)} className={optBtn(selModel === o.value)}>
                                {o.label}
                              </button>
                            ))}
                            {opts.length === 0 && (
                              <p className="col-span-full py-8 text-center text-ink/40 text-sm">
                                {vehQuery ? `No models matching "${vehQuery}".` : "No models for this make."}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {vehStep === "year" && (() => {
                        const opts = vehFilter(displayYears);
                        return (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {opts.map((o) => (
                              <button key={o.value} type="button" onClick={() => pickYear(o.value)} className={optBtn(selYear === o.value)}>
                                {o.label}
                              </button>
                            ))}
                            {opts.length === 0 && (
                              <p className="col-span-full py-8 text-center text-ink/40 text-sm">
                                {vehQuery ? `No years matching "${vehQuery}".` : "No years for this model."}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {vehStep === "engine" && (() => {
                        const baseOpts: AttrOption[] = displayEngines.length > 0
                          ? displayEngines
                          : [{ label: "All Trims", value: "all" }];
                        const filtered = vehFilter(baseOpts);

                        // Group by fuel type
                        const groups = filtered.reduce<Record<string, AttrOption[]>>((acc, eng) => {
                          const key = eng.fuel ?? "Other";
                          (acc[key] ??= []).push(eng);
                          return acc;
                        }, {});

                        return (
                          <div className="space-y-5 w-full">
                            {Object.entries(groups).map(([fuel, engs]) => (
                              <div key={fuel}>
                                {fuel !== "Other" && (
                                  <p className="text-center text-sm font-semibold text-gray-500 mb-3">{fuel}</p>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {engs.map((o) => (
                                    <button
                                      key={o.value}
                                      type="button"
                                      onClick={() => pickEngine(o.value)}
                                      className={`border py-3.5 px-2 rounded-xl text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${selEngine === o.value
                                          ? "bg-black text-white border-black"
                                          : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"
                                        }`}
                                    >
                                      {o.label}
                                      {o.hp && <sup className="text-[9px] font-bold ml-0.5">{o.hp}hp</sup>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {filtered.length === 0 && (
                              <p className="py-8 text-center text-ink/40 text-sm">No engine trims found.</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {!(selVehicle && selModel && selYear && selEngine) && (
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button
                      type="button"
                      disabled={!selVehicle}
                      onClick={() => {
                        setVehOpen(false);
                        handleVehicleSearch({ preventDefault: () => { } } as React.FormEvent);
                      }}
                      className="bg-[#ed1c24] hover:bg-[#c6181d] text-white font-black text-xs uppercase tracking-widest py-3 px-8 rounded-xl transition-colors disabled:opacity-40"
                    >
                      Find Tyres
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}
