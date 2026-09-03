"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { X, Search, ArrowLeft, ArrowRight } from "lucide-react";
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
    const handleScroll = () => {
      // Tyre Finder stays sticky throughout the page once scrolled
      setIsSticky(window.scrollY > 100);
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
          // Keep every attribute — width/height/rim are now full option
          // lists from customAttributeMetadataV2 (not the capped aggregation).
          // Drop junk labels like "None" / blank.
          map[attr.attribute_code] = (attr.attribute_options ?? []).filter(
            (o: AttrOption) => o.label && o.label.toLowerCase() !== "none"
          );
        }
        setMeta(map);
        // Widths come from the full metadata list now, so they are ready.
        setWidths(sortSizeOpts(map.width ?? []));
        setWidthLoad(false);
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

  /* Widths come from the full customAttributeMetadataV2 list (loaded with the
     other metadata on mount), NOT the 10-bucket product aggregation — the
     aggregation only ever returns the 10 most common widths. */

  /* Heights/rims use the full metadata lists (see displayHeights/displayRims).
     Clear stale child selections when width changes; do not narrow to the
     capped aggregation. */
  useEffect(() => {
    if (!selWidth) { setSelHeight(""); setSelRim(""); }
  }, [selWidth]);

  /* Rims use the full metadata list; clear stale rim when height changes. */
  useEffect(() => {
    if (!selWidth || !selHeight) setSelRim("");
  }, [selWidth, selHeight]);

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
  const displayHeights = meta.height ?? childHeights ?? [];
  const displayRims = meta.rim ?? childRims ?? [];
  const displayModels = childModels ?? meta.model ?? [];
  const displayYears = childYears ?? meta.year ?? [];
  const displayEngines = childEngines ?? [];

  /* ── label lookup ──────────────────────────────────────────────── */
  const labelFor = (code: string, value: string): string => {
    let source: AttrOption[];
    if (code === "width") source = meta.width ?? widths;
    else if (code === "height") source = meta.height ?? childHeights ?? [];
    else if (code === "rim") source = meta.rim ?? childRims ?? [];
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
    // Widths come from the full customAttributeMetadataV2 list loaded on mount
    // (uncapped) — do NOT re-fetch from the 10-bucket aggregation here.
  };

  useEffect(() => { setSizeQuery(""); }, [sizeStep]);

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
      style={isSticky ? {} : undefined}
            // style={isSticky ? { height: 64 } : undefined}

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
                    <div className="search-wrap-inner">
                      <ul className="list-none selection-list">
                        <li>
                          <button
                            type="button"
                            onClick={() => openSize("width")}
                            className={`selection-item ${selWidth ? "is-set" : ""}`}
                          >
                            <span>{selWidth ? labelFor("width", selWidth) : "Width"}</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            disabled={!selWidth}
                            onClick={() => openSize("height")}
                            className={`selection-item ${!selWidth ? "disabled" : ""} ${selHeight ? "is-set" : ""}`}
                          >
                            <span>{selHeight ? labelFor("height", selHeight) : "Height"}</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            disabled={!selHeight}
                            onClick={() => openSize("rim")}
                            className={`selection-item ${!selHeight ? "disabled" : ""} ${selRim ? "is-set" : ""}`}
                          >
                            <span>{selRim ? `R${labelFor("rim", selRim)}` : "Rim"}</span>
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
                            disabled={metaLoading}
                            onClick={() => openVeh("vehicle")}
                            className={`selection-item ${metaLoading ? "disabled" : ""} ${selVehicle ? "is-set" : ""}`}
                          >
                            <span>{selVehicle ? labelFor("vehicle", selVehicle) : "Make"}</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            disabled={!selVehicle || depLoading}
                            onClick={() => openVeh("model")}
                            className={`selection-item ${(!selVehicle || depLoading) ? "disabled" : ""} ${selModel ? "is-set" : ""}`}
                          >
                            <span>{selModel ? labelFor("model", selModel) : "Model"}</span>
                            <ArrowRight size={16} className="sel-arrow" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            disabled={!selModel || depLoading}
                            onClick={() => openVeh("year")}
                            className={`selection-item ${(!selModel || depLoading) ? "disabled" : ""} ${selYear ? "is-set" : ""}`}
                          >
                            <span>{selYear ? labelFor("year", selYear) : "Year"}</span>
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
          {sizeOpen && (
            <div className="finder-modal-overlay" onClick={closeSize}>
              <div
                className="finder-selection-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Find tyres by size"
              >
                {/* ── HEADER ── */}
                <div className="finder-modal-header">
                  <div className="finder-modal-header-top">
                    <div className="finder-header-title">
                      <h4 className="finder-header-h2">What size are your tyres?</h4>
                      <p className="finder-header-subtitle">
                        {sizeStep === "width"
                          ? "Pick the width — the first number on your sidewall (e.g. 235)."
                          : sizeStep === "height"
                          ? "Now the aspect ratio (height) — the second number (e.g. 40)."
                          : "Finally, the rim diameter in inches (e.g. R20)."}
                      </p>
                    </div>

                    <div className="finder-current-selection">
                      <span className="finder-current-selection-label">Current Selection</span>
                      <span className="finder-current-selection-value">
                        {selWidth ? labelFor("width", selWidth) : "\u2014"} /{" "}
                        {selHeight ? labelFor("height", selHeight) : "\u2014"} R
                        {selRim ? labelFor("rim", selRim) : "\u2014"}
                      </span>
                    </div>

                    <button type="button" className="finder-close-btn" onClick={closeSize} aria-label="Close">
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Step tabs */}
                  <div className="steps">
                    <ul className="finder-step-tabs list-none">
                      {([
                        { id: "width" as SizeStep,  label: "Width",  val: selWidth ? labelFor("width", selWidth) : "Select" },
                        { id: "height" as SizeStep, label: "Height", val: selHeight ? labelFor("height", selHeight) : "Select" },
                        { id: "rim" as SizeStep,    label: "Rim",    val: selRim ? `R${labelFor("rim", selRim)}` : "Select" },
                      ]).map((t) => {
                        const done =
                          (t.id === "width" && selWidth && sizeStep !== "width") ||
                          (t.id === "height" && selHeight && sizeStep === "rim") ||
                          (t.id === "rim" && selRim);
                        const locked =
                          (t.id === "height" && !selWidth) || (t.id === "rim" && !selHeight);
                        return (
                          <li
                            key={t.id}
                            className={`finder-step-tab ${sizeStep === t.id ? "active" : ""} ${done ? "done" : ""} ${locked ? "locked" : ""}`}
                          >
                            <button
                              type="button"
                              disabled={locked}
                              onClick={() => !locked && setSizeStep(t.id)}
                            >
                              <span className="finder-step-tab-label">{t.label}</span>
                              <span className="finder-step-tab-value">{t.val}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* ── BODY ── */}
                <div className="finder-modal-body">
                  {(depLoading || (sizeStep === "width" && widthLoading)) ? (
                    <div className="finder-loader">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/loader-style1.svg" alt="Loading" width={56} height={56} />
                    </div>
                  ) : (
                    <>
                      <div className="finder-search-box">
                        <Search size={16} />
                        <input
                          type="text"
                          className="finder-option-search"
                          placeholder={`Search ${sizeStep}...`}
                          value={sizeQuery}
                          onChange={(e) => setSizeQuery(e.target.value)}
                        />
                      </div>

                      <ul className="finder-options-grid list-none">
                        {(sizeStep === "width" ? widths : sizeStep === "height" ? displayHeights : displayRims)
                          .filter((o) => o.label.toLowerCase().includes(sizeQuery.toLowerCase()))
                          .map((o) => {
                            const active =
                              (sizeStep === "width" && selWidth === o.value) ||
                              (sizeStep === "height" && selHeight === o.value) ||
                              (sizeStep === "rim" && selRim === o.value);
                            return (
                              <li key={o.value}>
                                <button
                                  type="button"
                                  className={`finder-option ${active ? "active" : ""}`}
                                  onClick={() =>
                                    sizeStep === "width" ? pickWidth(o.value)
                                    : sizeStep === "height" ? pickHeight(o.value)
                                    : pickRim(o.value)
                                  }
                                >
                                  {sizeStep === "rim" ? `R${o.label}` : o.label}
                                </button>
                              </li>
                            );
                          })}
                        {(sizeStep === "width" ? widths : sizeStep === "height" ? displayHeights : displayRims).length === 0 && (
                          <li className="finder-empty">No options available.</li>
                        )}
                      </ul>
                    </>
                  )}
                </div>

                {/* ── FOOTER ── */}
                <div className="finder-modal-footer">
                  <button
                    type="button"
                    className="finder-cancel-btn"
                    onClick={sizeStep === "width" ? closeSize : handleBack}
                  >
                    <ArrowLeft size={16} />
                    <span>{sizeStep === "width" ? "Cancel" : "Back"}</span>
                  </button>

                  <button
                    type="button"
                    className="finder-next-btn"
                    disabled={!(selWidth && selHeight && selRim)}
                    onClick={() => {
                      setSizeOpen(false);
                      handleSizeSearch({ preventDefault: () => {} } as React.FormEvent);
                    }}
                  >
                    <span>Search</span>
                    <Search size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

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
