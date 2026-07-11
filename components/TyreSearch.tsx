"use client";

import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useScrollLock } from "@/lib/useScrollLock";
import { APP_CONFIG } from "@/src/config/app-config";

type Option = { label: string; value: string; count?: number };
type TrimOption = { trim: string; size: { width: string; height: string; rim: string } };

interface TyreSearchProps {
  categoryUid?: string;
}

export default function TyreSearch({ categoryUid = APP_CONFIG.magento.tyresCategoryUid }: TyreSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<"size" | "vehicle" | "brand">("size");

  const [widths, setWidths] = useState<Option[]>([]);
  const [heights, setHeights] = useState<Option[]>([]);
  const [rims, setRims] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedWidth, setSelectedWidth] = useState("");
  const [selectedHeight, setSelectedHeight] = useState("");
  const [selectedRim, setSelectedRim] = useState("");

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [trims, setTrims] = useState<TrimOption[]>([]);

  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTrim, setSelectedTrim] = useState<TrimOption | null>(null);

  const [selectedBrand, setSelectedBrand] = useState("");

  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [sizeModalActiveTab, setSizeModalActiveTab] = useState<"width" | "height" | "rim">("width");

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalActiveTab, setVehicleModalActiveTab] = useState<"make" | "model" | "year">("make");
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [loadingVehicleOptions, setLoadingVehicleOptions] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  const openSizeModal = (tab: "width" | "height" | "rim") => {
    setSizeModalActiveTab(tab);
    setSizeModalOpen(true);
  };

  const closeSizeModal = () => {
    setSizeModalOpen(false);
    setSelectedWidth("");
    setSelectedHeight("");
    setSelectedRim("");
    setSizeModalActiveTab("width");
  };

  const handleSelectWidth = (value: string) => {
    if (selectedWidth === value) { setSelectedWidth(""); } else { setSelectedWidth(value); setSizeModalActiveTab("height"); }
  };
  const handleSelectHeight = (value: string) => {
    if (selectedHeight === value) { setSelectedHeight(""); } else { setSelectedHeight(value); setSizeModalActiveTab("rim"); }
  };
  const handleSelectRim = (value: string) => {
    if (selectedRim === value) { setSelectedRim(""); } else { setSelectedRim(value); setSizeModalOpen(false); }
  };

  const openVehicleModal = (tab: "make" | "model" | "year") => {
    setVehicleModalActiveTab(tab);
    setVehicleSearchQuery("");
    setVehicleModalOpen(true);
  };

  const closeVehicleModal = () => {
    setVehicleModalOpen(false);
    setSelectedMake("");
    setSelectedModel("");
    setSelectedYear("");
    setSelectedTrim(null);
    setVehicleSearchQuery("");
    setVehicleModalActiveTab("make");
  };

  const handleSelectMake = (make: string) => { setSelectedMake(make); setSelectedModel(""); setSelectedYear(""); setSelectedTrim(null); setVehicleSearchQuery(""); setVehicleModalActiveTab("model"); };
  const handleSelectModel = (model: string) => { setSelectedModel(model); setSelectedYear(""); setSelectedTrim(null); setVehicleSearchQuery(""); setVehicleModalActiveTab("year"); };
  const handleSelectYear = (year: string) => { setSelectedYear(year); setSelectedTrim(null); setVehicleSearchQuery(""); };
  const handleSelectTrim = (trimObj: TrimOption) => { setSelectedTrim(trimObj); setVehicleSearchQuery(""); setVehicleModalOpen(false); };

  useScrollLock(sizeModalOpen || vehicleModalOpen);

  useEffect(() => {
    setSelectedWidth("");
    setSelectedHeight("");
    setSelectedRim("");
    setSelectedMake("");
    setSelectedModel("");
    setSelectedYear("");
    setSelectedTrim(null);
    setSizeModalActiveTab("width");
    setVehicleModalActiveTab("make");
    setVehicleSearchQuery("");
  }, [pathname]);

  const filteredMakes = makes.filter((m) => m.toLowerCase().includes(vehicleSearchQuery.toLowerCase()));
  const filteredModels = models.filter((m) => m.toLowerCase().includes(vehicleSearchQuery.toLowerCase()));
  const filteredYears = years.filter((y) => y.toLowerCase().includes(vehicleSearchQuery.toLowerCase()));
  const filteredTrims = trims.filter((t) => t.trim.toLowerCase().includes(vehicleSearchQuery.toLowerCase()));

  useEffect(() => {
    fetch("/api/search-options")
      .then((res) => res.json())
      .then((data) => { setWidths(data.widths ?? []); setHeights(data.heights ?? []); setRims(data.rims ?? []); setBrands(data.brands ?? []); setLoadingOptions(false); })
      .catch(() => setLoadingOptions(false));
  }, []);

  useEffect(() => {
    fetch("/api/vehicles").then((res) => res.json()).then((data) => setMakes(data.makes ?? [])).catch(() => { });
  }, []);

  useEffect(() => {
    if (!selectedMake) { setModels([]); setYears([]); setTrims([]); return; }
    setLoadingVehicleOptions(true);
    fetch(`/api/vehicles?make=${encodeURIComponent(selectedMake)}`).then((res) => res.json()).then((data) => { setModels(data.models ?? []); setYears([]); setTrims([]); setLoadingVehicleOptions(false); }).catch(() => setLoadingVehicleOptions(false));
  }, [selectedMake]);

  useEffect(() => {
    if (!selectedMake || !selectedModel) { setYears([]); setTrims([]); return; }
    setLoadingVehicleOptions(true);
    fetch(`/api/vehicles?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`).then((res) => res.json()).then((data) => { setYears(data.years ?? []); setTrims([]); setLoadingVehicleOptions(false); }).catch(() => setLoadingVehicleOptions(false));
  }, [selectedMake, selectedModel]);

  useEffect(() => {
    if (!selectedMake || !selectedModel || !selectedYear) { setTrims([]); return; }
    setLoadingVehicleOptions(true);
    fetch(`/api/vehicles?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}&year=${encodeURIComponent(selectedYear)}`).then((res) => res.json()).then((data) => { setTrims(data.trims ?? []); setLoadingVehicleOptions(false); }).catch(() => setLoadingVehicleOptions(false));
  }, [selectedMake, selectedModel, selectedYear]);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabChange = (tab: "size" | "vehicle" | "brand") => setActiveTab(tab);

  const handleSizeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWidth && !selectedHeight && !selectedRim) return;
    const params = new URLSearchParams();
    params.set("categoryUid", categoryUid);
    if (selectedWidth) params.set("width", selectedWidth);
    if (selectedHeight) params.set("height", selectedHeight);
    if (selectedRim) params.set("rim", selectedRim);
    router.push(`/shop?${params.toString()}`);
  };

  const handleVehicleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrim) return;
    const { width, height, rim } = selectedTrim.size;
    const params = new URLSearchParams();
    params.set("categoryUid", categoryUid);
    params.set("width", width);
    params.set("height", height);
    params.set("rim", rim);
    router.push(`/shop?${params.toString()}`);
  };

  const handleBrandSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    const params = new URLSearchParams();
    params.set("categoryUid", categoryUid);
    params.set("mgs_brand", selectedBrand);
    router.push(`/shop?${params.toString()}`);
  };

  const fieldBtn =
    "w-full bg-transparent text-black font-normal text-[13px] outline-none cursor-pointer flex items-center justify-between";

  return (
    <div className="tyre-search-sticky-wrapper">
      <section
        id="search"
        className={`search-wrap tyreform ${isSticky ? "sticky" : ""}`}
      >
        <form
          onSubmit={
            activeTab === "vehicle"
              ? handleVehicleSearch
              : activeTab === "brand"
                ? handleBrandSearch
                : handleSizeSearch
          }
        >
          <div className="main-search">
            <div className="search-tabs">

              {/* Left: dark charcoal tab pills */}
              <div id="nav-tab" className="nav nav-tabs justify-content-center" role="tablist">
                {[
                  { id: "size", label: "Search Tyre Size" },
                  { id: "vehicle", label: "Search Vehicle" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id as "size" | "vehicle" | "brand")}
                    className={`button ${activeTab === tab.id ? "active" : ""}`}
                    role="tab"
                    aria-selected={activeTab === tab.id ? "true" : "false"}
                  >
                    <a>{tab.label}</a>
                  </button>
                ))}
              </div>

              {/* Right: white pill with red border — fields only, no submit */}
              <div id="navTabContent" className="tab-content">
                <div className="tab-inner">

                  {activeTab === "size" && (
                    <div className="flex items-center w-full h-full">
                      <div className="search-field-wrap">
                        <button type="button" disabled={loadingOptions} onClick={() => openSizeModal("width")} className={fieldBtn}>
                          <span className="text-black">{selectedWidth || "Width"}</span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>
                      <div className="search-divider" />
                      <div className="search-field-wrap">
                        <button type="button" disabled={loadingOptions} onClick={() => openSizeModal("height")} className={fieldBtn}>
                          <span className="text-black">{selectedHeight || "Height"}</span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>
                      <div className="search-divider" />
                      <div className="search-field-wrap">
                        <button type="button" disabled={loadingOptions} onClick={() => openSizeModal("rim")} className={fieldBtn}>
                          <span className="text-black">{selectedRim ? `R${selectedRim}` : "Rim"}</span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "vehicle" && (
                    <div className="flex items-center w-full h-full">
                      <div className="search-field-wrap">
                        <button type="button" onClick={() => openVehicleModal("make")} className={fieldBtn}>
                          <span className="text-black">{selectedMake || "Make"}</span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>
                      <div className="search-divider" />
                      <div className="search-field-wrap">
                        <button type="button" disabled={!selectedMake} onClick={() => openVehicleModal("model")} className={`${fieldBtn} disabled:opacity-40`}>
                          <span className="text-black">{selectedModel || "Model"}</span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>
                      <div className="search-divider" />
                      <div className="search-field-wrap">
                        <button type="button" disabled={!selectedModel} onClick={() => openVehicleModal("year")} className={`${fieldBtn} disabled:opacity-40`}>
                          <span className="text-black">{selectedYear || "Year"}</span>
                          <span className="text-black/35 text-xs ml-2">→</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "brand" && (
                    <div className="flex items-center w-full h-full">
                      <div className="search-field-wrap flex-1">
                        <select
                          disabled={loadingOptions}
                          value={selectedBrand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="w-full bg-transparent text-black font-normal text-[13px] outline-none cursor-pointer appearance-none disabled:opacity-50"
                        >
                          <option value="">Select Brand</option>
                          {brands.map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Submit — outside white pill, right end of outer black container */}

          </div>
        </form>
      </section>

      {/* ── Size Selection Modal ─────────────────────────────────── */}
      {sizeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={closeSizeModal} />
          <div className="relative w-full max-w-[760px] max-h-[85vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                <h3 className="text-base font-bold text-ink">
                  Current Selection :{" "}
                  {selectedWidth || selectedHeight || selectedRim ? (
                    <span className="text-[#ed1c24] font-extrabold font-mono ml-1.5">
                      {selectedWidth || "—"} / {selectedHeight || "—"} {selectedRim ? `R${selectedRim}` : "—"}
                    </span>
                  ) : (
                    <span className="text-ink/40 font-medium ml-1.5"></span>
                  )}
                </h3>
                {(selectedWidth || selectedHeight || selectedRim) && (
                  <button
                    type="button"
                    onClick={() => { setSelectedWidth(""); setSelectedHeight(""); setSelectedRim(""); setSizeModalActiveTab("width"); }}
                    className="text-xs font-bold text-[#ed1c24] hover:underline ml-4"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={closeSizeModal}
                className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            {/* Tabs */}
            <div className="grid grid-cols-3 w-full border-b border-gray-100">
              {(["width", "height", "rim"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSizeModalActiveTab(t)}
                  className={`py-3.5 text-center font-bold text-xs uppercase tracking-wider transition-all duration-200 ${sizeModalActiveTab === t ? "bg-black text-white" : "bg-[#ed1c24] hover:bg-[#d61920] text-white"}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {/* Options */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {sizeModalActiveTab === "width" && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {widths.map((o) => (
                    <button key={o.value} type="button" onClick={() => handleSelectWidth(o.value)}
                      className={`border py-3.5 rounded-xl text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${selectedWidth === o.value ? "bg-black text-white border-black" : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"}`}>
                      {o.label}
                    </button>
                  ))}
                  {widths.length === 0 && <div className="col-span-full py-8 text-center text-ink/40 text-sm">No width options available.</div>}
                </div>
              )}
              {sizeModalActiveTab === "height" && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {heights.map((o) => (
                    <button key={o.value} type="button" onClick={() => handleSelectHeight(o.value)}
                      className={`border py-3.5 rounded-xl text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${selectedHeight === o.value ? "bg-black text-white border-black" : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"}`}>
                      {o.label}
                    </button>
                  ))}
                  {heights.length === 0 && <div className="col-span-full py-8 text-center text-ink/40 text-sm">No height options available.</div>}
                </div>
              )}
              {sizeModalActiveTab === "rim" && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {rims.map((o) => (
                    <button key={o.value} type="button" onClick={() => handleSelectRim(o.value)}
                      className={`border py-3.5 rounded-xl text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${selectedRim === o.value ? "bg-black text-white border-black" : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"}`}>
                      R{o.label}
                    </button>
                  ))}
                  {rims.length === 0 && <div className="col-span-full py-8 text-center text-ink/40 text-sm">No rim options available.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Vehicle Selection Modal ──────────────────────────────── */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={closeVehicleModal} />
          <div className="relative w-full max-w-[760px] max-h-[85vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                <h3 className="text-base font-bold text-ink">
                  Current Vehicle Selection :{" "}
                  {selectedMake || selectedModel || selectedYear || selectedTrim ? (
                    <span className="text-[#ed1c24] font-extrabold font-mono ml-1.5">
                      {selectedMake || "—"} / {selectedModel || "—"} / {selectedYear || "—"} / {selectedTrim ? selectedTrim.trim.split(" (")[0] : "—"}
                    </span>
                  ) : (
                    <span className="text-ink/40 font-medium ml-1.5"></span>
                  )}
                </h3>
                {(selectedMake || selectedModel || selectedYear || selectedTrim) && (
                  <button
                    type="button"
                    onClick={() => { setSelectedMake(""); setSelectedModel(""); setSelectedYear(""); setSelectedTrim(null); setVehicleSearchQuery(""); setVehicleModalActiveTab("make"); }}
                    className="text-xs font-bold text-[#ed1c24] hover:underline ml-4"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={closeVehicleModal}
                className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            {/* Tabs */}
            <div className="grid grid-cols-3 w-full border-b border-gray-100">
              {(["make", "model", "year"] as const).map((t, i) => (
                <button
                  key={t}
                  type="button"
                  disabled={i === 1 ? !selectedMake : i === 2 ? !selectedModel : false}
                  onClick={() => {
                    setVehicleModalActiveTab(t);
                    if (t === "year") {
                      setSelectedYear("");
                      setSelectedTrim(null);
                    }
                  }}
                  className={`py-3.5 text-center font-bold text-[11px] uppercase tracking-wider transition-all duration-200 disabled:opacity-50 ${vehicleModalActiveTab === t ? "bg-black text-white" : "bg-[#ed1c24] hover:bg-[#d61920] text-white"}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {/* Search Box */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm focus-within:border-black transition-colors">
                <Search size={15} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={vehicleSearchQuery}
                  onChange={(e) => setVehicleSearchQuery(e.target.value)}
                  placeholder="Search here ..."
                  className="bg-transparent text-xs text-ink outline-none flex-1 placeholder:text-gray-400"
                />
                {vehicleSearchQuery && (
                  <button type="button" onClick={() => setVehicleSearchQuery("")} className="text-gray-400 hover:text-ink transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
            {/* Options */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {loadingVehicleOptions ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-[#ed1c24] rounded-full animate-spin"></div>
                  <span className="mt-3 text-xs font-semibold text-gray-400">Loading options...</span>
                </div>
              ) : (
                <>
                  {vehicleModalActiveTab === "make" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredMakes.map((m) => (
                        <button key={m} type="button" onClick={() => handleSelectMake(m)}
                          className={`border py-3.5 rounded-xl text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${selectedMake === m ? "bg-black text-white border-black" : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"}`}>
                          {m}
                        </button>
                      ))}
                      {filteredMakes.length === 0 && <div className="col-span-full py-8 text-center text-ink/40 text-sm">No makes matching &quot;{vehicleSearchQuery}&quot; found.</div>}
                    </div>
                  )}
                  {vehicleModalActiveTab === "model" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredModels.map((m) => (
                        <button key={m} type="button" onClick={() => handleSelectModel(m)}
                          className={`border py-3.5 rounded-xl text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${selectedModel === m ? "bg-black text-white border-black" : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"}`}>
                          {m}
                        </button>
                      ))}
                      {filteredModels.length === 0 && <div className="col-span-full py-8 text-center text-ink/40 text-sm">No models matching &quot;{vehicleSearchQuery}&quot; found.</div>}
                    </div>
                  )}
                  {vehicleModalActiveTab === "year" && (
                    selectedYear ? (
                      <div className="grid grid-cols-1 gap-3">
                        {filteredTrims.map((t) => (
                          <button key={t.trim} type="button" onClick={() => handleSelectTrim(t)}
                            className="border py-3.5 px-4 rounded-xl text-left text-sm font-bold transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50 flex items-center justify-between">
                            <span>{t.trim}</span>
                            <span className="text-[11px] text-gray-500 font-mono font-bold">
                              {t.size.width}/{t.size.height} R{t.size.rim}
                            </span>
                          </button>
                        ))}
                        {filteredTrims.length === 0 && <div className="col-span-full py-8 text-center text-ink/40 text-sm">No trims matching &quot;{vehicleSearchQuery}&quot; found.</div>}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {filteredYears.map((y) => (
                          <button key={y} type="button" onClick={() => handleSelectYear(y)}
                            className={`border py-3.5 rounded-xl text-center text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${selectedYear === y ? "bg-black text-white border-black" : "bg-white text-ink border-gray-200 hover:border-black hover:bg-gray-50"}`}>
                            {y}
                          </button>
                        ))}
                        {filteredYears.length === 0 && <div className="col-span-full py-8 text-center text-ink/40 text-sm">No years matching &quot;{vehicleSearchQuery}&quot; found.</div>}
                      </div>
                    )
                  )}

                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
