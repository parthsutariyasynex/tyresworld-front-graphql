"use client";

import React, { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { t, storeCode, type Locale } from "@/lib/i18n";

type Opt = { label: string; value: string };

interface Props {
  sectionRef?: RefObject<HTMLElement | null>;
  isSticky?: boolean;
  locale: Locale;
  basePath: string;
  dir: "ltr" | "rtl";
}

export default function StickyTyreSearch({
  sectionRef,
  isSticky: propIsSticky,
  locale,
  basePath,
  dir,
}: Props) {
  const [isSticky, setIsSticky] = useState(propIsSticky ?? false);
  const innerRef = useRef<HTMLElement>(null);
  const ref = sectionRef ?? innerRef;
  const router = useRouter();
  const store = storeCode(locale);

  useEffect(() => {
    if (propIsSticky !== undefined) {
      setIsSticky(propIsSticky);
      return;
    }
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [propIsSticky]);

  const [tab, setTab] = useState<"size" | "vehicle">("size");
  const [widths, setWidths]   = useState<Opt[]>([]);
  const [heights, setHeights] = useState<Opt[]>([]);
  const [rims, setRims]       = useState<Opt[]>([]);
  const [width, setWidth]   = useState("");
  const [height, setHeight] = useState("");
  const [rim, setRim]       = useState("");
  const [makes, setMakes]   = useState<Opt[]>([]);
  const [models, setModels] = useState<Opt[]>([]);
  const [years, setYears]   = useState<Opt[]>([]);
  const [make, setMake]   = useState("");
  const [model, setModel] = useState("");
  const [year, setYear]   = useState("");

  useEffect(() => {
    fetch(`/api/search-options?locale=${locale}&store=${store}`)
      .then(r => r.json())
      .then(d => { setWidths(d.widths ?? []); setHeights(d.heights ?? []); setRims(d.rims ?? []); })
      .catch(() => {});
    fetch(`/api/vehicles?store=${store}`)
      .then(r => r.json())
      .then(d => setMakes(d.makes ?? []))
      .catch(() => {});
  }, [store, locale]);

  useEffect(() => {
    if (!make) { setModels([]); setYears([]); return; }
    fetch(`/api/vehicles?make=${encodeURIComponent(make)}&store=${store}`)
      .then(r => r.json()).then(d => setModels(d.models ?? [])).catch(() => {});
  }, [make, store]);

  useEffect(() => {
    if (!make || !model) { setYears([]); return; }
    fetch(`/api/vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&store=${store}`)
      .then(r => r.json()).then(d => setYears(d.years ?? [])).catch(() => {});
  }, [make, model, store]);

  const submitSize = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (width)  p.set("width", width);
    if (height) p.set("height", height);
    if (rim)    p.set("rim", rim);
    router.push(`${basePath}?${p}`);
  };

  const submitVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (make)  p.set("vehicle", make);
    if (model) p.set("model", model);
    if (year)  p.set("year", year);
    router.push(`${basePath}?${p}`);
  };

  const selectCls = (val: string) =>
    `w-full bg-transparent outline-none appearance-none cursor-pointer text-[13px] md:text-[15px] font-normal leading-none text-black`;

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`search-wrap tyreform ${isSticky ? "sticky" : ""}`}
      dir={dir}
    >
      <div className="w-full px-4 py-3">

        <div className="main-search">
          <div className="search-tabs">

            {/* Left: Tab buttons */}
            <div id="nav-tab" className="nav nav-tabs justify-content-center" role="tablist">
              {(["size", "vehicle"] as const).map(tk => (
                <button
                  key={tk}
                  type="button"
                  onClick={() => setTab(tk)}
                  className={`button ${tab === tk ? "active" : ""}`}
                  role="tab"
                  aria-selected={tab === tk ? "true" : "false"}
                >
                  <a>{tk === "size" ? t(locale, "listing.searchByTyreSize") : t(locale, "listing.searchByVehicle")}</a>
                </button>
              ))}
            </div>

            {/* Right: Tab Content */}
            <div id="navTabContent" className="tab-content">
              <div className="tab-inner">

                {/* Size form */}
                {tab === "size" && (
                  <form onSubmit={submitSize} className="flex w-full h-full items-center">
                    <div className="search-field-wrap">
                      <select
                        value={width}
                        onChange={e => setWidth(e.target.value)}
                        className={selectCls(width)}
                      >
                        <option value="">{t(locale, "listing.width")}</option>
                        {widths.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span className="text-black/35 text-xs ml-2 flex-shrink-0">→</span>
                    </div>
                    <div className="search-divider" />

                    <div className="search-field-wrap">
                      <select
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        className={selectCls(height)}
                      >
                        <option value="">{t(locale, "listing.height")}</option>
                        {heights.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span className="text-black/35 text-xs ml-2 flex-shrink-0">→</span>
                    </div>
                    <div className="search-divider" />

                    <div className="search-field-wrap">
                      <select
                        value={rim}
                        onChange={e => setRim(e.target.value)}
                        className={selectCls(rim)}
                      >
                        <option value="">{t(locale, "listing.rim")}</option>
                        {rims.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span className="text-black/35 text-xs ml-2 flex-shrink-0">→</span>
                    </div>

                    <button type="submit" className="sr-only">{t(locale, "nav.search")}</button>
                  </form>
                )}

                {/* Vehicle form */}
                {tab === "vehicle" && (
                  <form onSubmit={submitVehicle} className="flex w-full h-full items-center">
                    <div className="search-field-wrap">
                      <select
                        value={make}
                        onChange={e => { setMake(e.target.value); setModel(""); setYear(""); }}
                        className={selectCls(make)}
                      >
                        <option value="">{t(locale, "listing.make")}</option>
                        {makes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <span className="text-black/35 text-xs ml-2 flex-shrink-0">→</span>
                    </div>
                    <div className="search-divider" />

                    <div className="search-field-wrap">
                      <select
                        value={model}
                        onChange={e => { setModel(e.target.value); setYear(""); }}
                        disabled={!make}
                        className={selectCls(model)}
                      >
                        <option value="">{t(locale, "listing.model")}</option>
                        {models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <span className="text-black/35 text-xs ml-2 flex-shrink-0">→</span>
                    </div>
                    <div className="search-divider" />

                    <div className="search-field-wrap">
                      <select
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        disabled={!model}
                        className={selectCls(year)}
                      >
                        <option value="">{t(locale, "filter.year")}</option>
                        {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                      </select>
                      <span className="text-black/35 text-xs ml-2 flex-shrink-0">→</span>
                    </div>

                    <button type="submit" className="sr-only">{t(locale, "nav.search")}</button>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
