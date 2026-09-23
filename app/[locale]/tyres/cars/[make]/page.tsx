"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import { buildTyreSizeSlug } from "@/lib/filterBuilder";
import PageHeroBanner from "@/components/PageHeroBanner";
import type { BreadcrumbExtraItem } from "@/components/Breadcrumbs";
import {
  fetchMakes,
  fetchModels,
  fetchYears,
  fetchTrims,
  fetchSizes,
  type VehicleOption,
  type VehicleSize,
} from "@/lib/vehicleFinderApi";

type Step = "model" | "year" | "trim";

export default function VehicleMakeBrowserPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = String(params.locale ?? "en");
  const make = String(params.make ?? "");
  const modelParam = searchParams.get("model") ?? "";

  const [step, setStep] = useState<Step>("model");

  const [makeInfo, setMakeInfo] = useState<VehicleOption | null>(null);
  const [makeLoading, setMakeLoading] = useState(true);

  const [models, setModels] = useState<VehicleOption[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selModel, setSelModel] = useState<VehicleOption | null>(() => {
    if (modelParam) {
      return {
        value: modelParam,
        label: modelParam.charAt(0).toUpperCase() + modelParam.slice(1).replace(/-/g, " "),
      };
    }
    return null;
  });

  const [years, setYears] = useState<VehicleOption[] | null>(null);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [selYear, setSelYear] = useState<string>("");

  const [trims, setTrims] = useState<VehicleOption[] | null>(null);
  const [trimsLoading, setTrimsLoading] = useState(false);
  const [selTrim, setSelTrim] = useState<VehicleOption | null>(null);

  const [sizes, setSizes] = useState<VehicleSize[] | null>(null);
  const [sizesLoading, setSizesLoading] = useState(false);

  const [carImage, setCarImage] = useState<string | null>(null);
  const [carImageLoading, setCarImageLoading] = useState(false);

  /* ── dynamic car body image for the selected make + model ── */
  useEffect(() => {
    const modelVal = selModel?.value;
    if (!make || !modelVal) {
      setCarImage(null);
      setCarImageLoading(false);
      return;
    }
    let active = true;
    setCarImageLoading(true);
    const url = `/api/vehicle-image?make=${encodeURIComponent(make)}&model=${encodeURIComponent(modelVal)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setCarImage(d.image || "/images/car-model-showcase.jpg");
      })
      .catch(() => {
        if (active) setCarImage("/images/car-model-showcase.jpg");
      })
      .finally(() => {
        if (active) setCarImageLoading(false);
      });
    return () => {
      active = false;
    };
  }, [make, selModel?.value]);

  /* ── make label + logo ── */
  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    setMakeLoading(true);
    fetchMakes(locale, ctrl.signal)
      .then(({ options }) => {
        if (!active) return;
        setMakeInfo(options.find((o) => o.value === make) ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setMakeLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [locale, make]);

  /* ── models for this make ── */
  useEffect(() => {
    if (!make) return;
    let active = true;
    const ctrl = new AbortController();
    setModelsLoading(true);
    setModelsError(null);
    fetchModels(make, locale, ctrl.signal)
      .then(({ options, error }) => {
        if (!active) return;
        setModels(options);
        if (error && options.length === 0) setModelsError(error);

        // Preselect model from query parameter if provided
        if (modelParam && options.length > 0) {
          const match = options.find(
            (o) =>
              o.value.toLowerCase() === modelParam.toLowerCase() ||
              o.label.toLowerCase() === modelParam.toLowerCase(),
          );
          if (match) {
            setSelModel((prev) => {
              if (prev && prev.value.toLowerCase() === match.value.toLowerCase() && prev.label === match.label) {
                return prev;
              }
              return match;
            });
            setStep("year");
          }
        }
      })
      .catch((e) => {
        if (!active || ctrl.signal.aborted) return;
        setModelsError(e instanceof Error ? e.message : "Network error");
      })
      .finally(() => {
        if (active) setModelsLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [make, locale, modelParam]);

  /* ── years once a model is picked ── */
  useEffect(() => {
    const modelVal = selModel?.value;
    if (!modelVal) {
      setYears(null);
      return;
    }
    let active = true;
    const ctrl = new AbortController();
    setYearsLoading(true);
    fetchYears(make, modelVal, locale, ctrl.signal)
      .then(({ options }) => {
        if (active) setYears(options);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setYearsLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [make, selModel?.value, locale]);

  /* ── trims once a year is picked ── */
  useEffect(() => {
    const modelVal = selModel?.value;
    if (!modelVal || !selYear) {
      setTrims(null);
      setTrimsLoading(false);
      return;
    }
    let active = true;
    const ctrl = new AbortController();
    setTrimsLoading(true);
    setSizesLoading(true);
    setSizes(null);
    fetchTrims(make, modelVal, selYear, locale, ctrl.signal)
      .then(({ options }) => {
        if (!active) return;
        setTrims(options);
        if (options.length > 0) {
          setSelTrim(options[0]);
        } else {
          setSelTrim(null);
          setSizes([]);
          setSizesLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setTrims([]);
          setSizes([]);
          setSizesLoading(false);
        }
      })
      .finally(() => {
        if (active) setTrimsLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [make, selModel?.value, selYear, locale]);

  /* ── sizes for the selected trim ── */
  useEffect(() => {
    const modelVal = selModel?.value;
    const trimVal = selTrim?.value;
    if (!modelVal || !selYear || !trimVal) {
      return;
    }
    let active = true;
    const ctrl = new AbortController();
    setSizesLoading(true);
    fetchSizes(make, modelVal, selYear, trimVal, locale, ctrl.signal)
      .then(({ sizes }) => {
        if (active) setSizes(sizes);
      })
      .catch(() => {
        if (active) setSizes([]);
      })
      .finally(() => {
        if (active) setSizesLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [make, selModel?.value, selYear, selTrim?.value, locale]);

  function pickModel(m: VehicleOption) {
    setSelModel(m);
    setSelYear("");
    setSelTrim(null);
    setSizes(null);
    setStep("year");
  }

  function pickYear(y: string) {
    if (selYear === y) return;
    setSelYear(y);
    setSelTrim(null);
    setSizes(null);
    setTrimsLoading(true);
    setSizesLoading(true);
    setStep("trim");
  }

  function backToModel() {
    setSelModel(null);
    setSelYear("");
    setSelTrim(null);
    setSizes(null);
    setStep("model");
  }

  function backToYear() {
    setSelYear("");
    setSelTrim(null);
    setSizes(null);
    setStep("year");
  }

  function pickSize(size: VehicleSize) {
    const filterObj: Record<string, string> = {
      width: size.width,
      height: size.height,
      rim: size.rim,
    };
    if (size.rear) {
      filterObj.rear_width = size.rear.width;
      filterObj.rear_height = size.rear.height;
      filterObj.rear_rim = size.rear.rim;
    }
    router.push(buildTyreSizeSlug(filterObj));
  }

  const makeLabel =
    makeInfo?.label ?? (make ? make.charAt(0).toUpperCase() + make.slice(1).replace(/-/g, " ") : "");

  const heroTitle = selModel
    ? `${makeLabel} ${selModel.label} Tyres and Car Services in UAE`
    : `${makeLabel} Tyres and Car Services in UAE`;

  const makeModelBreadcrumbExtra: BreadcrumbExtraItem[] = [
    ...(selModel
      ? [selYear ? { label: selModel.label, onClick: backToYear } : { label: selModel.label }]
      : []),
    ...(selYear ? [{ label: selYear }] : []),
  ];

  return (
    <div className="bg-white">
      <PageHeroBanner
        title={heroTitle}
        description={`Shop genuine ${makeLabel} tyres online in UAE at TyresWorld. Free mobile tyre fitting in Dubai, Abu Dhabi & Sharjah, manufacturer warranty, and best prices.`}
        breadcrumbLabel={makeLabel}
        breadcrumbExtra={makeModelBreadcrumbExtra}
        onBreadcrumbCurrentClick={selModel ? backToModel : undefined}
      />

      {/* ── MODEL SELECTION VIEW (when no model selected yet) ── */}
      {!selModel && (
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
              {`Select ${makeLabel} Model`}
            </h1>
            <p className="text-gray-500 text-sm mt-1.5 font-medium">
              {"Choose your vehicle model to view compatible tyre sizes and years"}
            </p>
          </div>

          {modelsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : modelsError && (models ?? []).length === 0 ? (
            <EmptyState text={"Couldn't load models."} />
          ) : (models ?? []).length === 0 ? (
            <EmptyState
              text={
                `No models available for ${makeLabel}.`
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {(models ?? []).map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => pickModel(m)}
                  className="px-5 py-4 rounded-xl border border-gray-200 bg-white text-sm sm:text-base font-bold text-gray-900 text-left hover:border-[#ed1c24] hover:text-[#ed1c24] hover:shadow-sm transition-all duration-150 cursor-pointer"
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL VIEW WHEN MODEL IS SELECTED (Reference Design Layout) ── */}
      {selModel && (
        <div className="w-full">
          {/* ── 2. [MAKE] [MODEL] TYRES SHOP Section (White background) ── */}
          <section className="py-8 sm:py-10 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-center mb-8 uppercase tracking-tight">
                <span className="text-gray-900">{makeLabel} {selModel.label} </span>
                <span className="text-[#ed1c24]">{"TYRES SHOP"}</span>
              </h1>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 max-w-3xl mx-auto">
                {/* Brand Logo Card */}
                <div className="w-[160px] sm:w-[180px] h-[100px] bg-white border border-gray-200/80 shadow-sm rounded-lg flex flex-col items-center justify-center p-3.5 shrink-0 hover:shadow-md transition-shadow">
                  {makeInfo?.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={makeInfo.logo}
                      alt={makeLabel}
                      className="max-h-12 max-w-[130px] object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
                      {makeLabel}
                    </span>
                  )}
                </div>

                {/* Info Text */}
                <div className="flex-1 text-center sm:text-left pt-1">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 leading-snug">
                    {`Buy Tyres for ${makeLabel} ${selModel.label} Online in the UAE`}
                  </h2>
                  <p className="text-xs sm:text-[13.5px] text-gray-600 leading-relaxed font-normal m-0">
                    {`Find the perfect tyres for your ${makeLabel.toLowerCase()} ${selModel.label.toLowerCase()} at TyresWorld. We stock trusted tyre brands tailored for your car, ensuring smooth handling, long-lasting durability, and a safer, more comfortable drive every time.`}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── 3. TOP REASONS TO BUY TYRES FROM US Section (Light Gray Background) ── */}
          <section className="py-10 sm:py-14 bg-[#f0f2f5] border-y border-gray-200/70">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-center uppercase tracking-tight">
                <span className="text-gray-900">{"TOP REASONS TO BUY "}</span>
                <span className="text-[#ed1c24]">{"TYRES FROM US"}</span>
              </h2>
              <p className="text-gray-900 text-center text-xs sm:text-sm mt-2 mb-8 sm:mb-10 font-bold">
                {"Enjoy great value, trusted quality, and seamless tyre services every time."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
                {/* Left Column: Bullet Points with Red Checks */}
                <div className="space-y-4">
                  {[
                    "Quick and reliable tyre services",
                    "Best price guarantee on all tyres",
                    "Brand warranty included on every tyres",
                    "Professional fitment at partner installer locations",
                    "Free doorstep delivery across the UAE",
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3.5">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[#ed1c24]">
                        <svg className="w-4 h-4 text-[#ed1c24]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Column: Sleek Car Model Image (Dynamic per car model) */}
                <div className="flex items-center justify-center min-h-[200px] w-full">
                  {carImageLoading ? (
                    <div className="w-full max-w-[360px] h-[170px] bg-gray-300/40 rounded-xl animate-pulse flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/loader-style1.svg" alt="Loading" width={32} height={32} className="opacity-40" />
                    </div>
                  ) : carImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={carImage}
                      alt={`${makeLabel} ${selModel.label}`}
                      className="w-full max-w-[440px] max-h-[240px] object-contain animate-fade-in transition-all duration-300 drop-shadow-xs"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* ── 4. FIND TYRES FOR [MAKE] [MODEL] MODELS (Year Selection) ── */}
          <section className="py-10 sm:py-12 bg-white">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-center uppercase tracking-tight">
                <span className="text-gray-900">{"FIND TYRES FOR "}</span>
                <span className="text-[#ed1c24]">{makeLabel} {selModel.label} {"MODELS"}</span>
              </h2>
              <p className="text-gray-900 text-center text-xs sm:text-sm mt-2 mb-8 sm:mb-10 font-bold">
                {`Choose from trusted brands, exact fitment, and great deals for your ${makeLabel}.`}
              </p>

              {/* Year Selection Row / Grid matching Reference */}
              {yearsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 max-w-4xl mx-auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : (years ?? []).length === 0 ? (
                <EmptyState text={"No years available for this model."} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 max-w-4xl mx-auto">
                  {(years ?? []).map((y) => {
                    const isSelected = selYear === y.value;
                    return (
                      <button
                        key={y.value}
                        type="button"
                        onClick={() => pickYear(y.value)}
                        className={`h-[48px] px-4 rounded-sm border text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? "border-[#ed1c24] bg-[#ed1c24] text-white shadow-sm"
                            : "border-gray-200/90 bg-white text-gray-900 hover:border-[#ed1c24] hover:text-[#ed1c24] shadow-2xs hover:shadow-xs"
                        }`}
                      >
                        {y.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── 5. Trims & Sizes Section (Appears once a year is selected) ── */}
              {selYear && (
                <div className="mt-12 bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 uppercase">
                        {`Trim & Compatible Sizes — ${selModel.label} (${selYear})`}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        {"Select trim or tyre size to view matching available tyres"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={backToYear}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>{"Change Year"}</span>
                    </button>
                  </div>

                  {/* Trims Selector */}
                  {trimsLoading ? (
                    <div className="flex gap-2 mb-6">
                      <div className="w-32 h-10 bg-gray-100 rounded-lg animate-pulse" />
                      <div className="w-32 h-10 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                  ) : (trims ?? []).length > 1 ? (
                    <div className="mb-6">
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 block mb-2.5">
                        {"Select Trim / Engine Variant:"}
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {(trims ?? []).map((tr) => {
                          const isSel = selTrim?.value === tr.value;
                          return (
                            <button
                              key={tr.value}
                              type="button"
                              onClick={() => setSelTrim(tr)}
                              className={`px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                isSel
                                  ? "border-[#ed1c24] bg-[#ed1c24] text-white shadow-xs"
                                  : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                              }`}
                            >
                              <span>{tr.label}</span>
                              {tr.hp != null && (
                                <span className={`text-[10px] ${isSel ? "text-white/80" : "text-gray-400"}`}>
                                  {tr.hp}hp
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Sizes Grid */}
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 block mb-3">
                      {"Compatible Tyre Sizes (Click to shop):"}
                    </span>

                    {trimsLoading || sizesLoading || sizes === null ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : sizes.length === 0 ? (
                      <EmptyState text={"No tyre sizes found for this trim."} />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        {(sizes ?? []).map((sz, idx) => (
                          <button
                            key={`${sz.label}-${sz.rearLabel ?? ""}-${idx}`}
                            type="button"
                            onClick={() => pickSize(sz)}
                            className="text-left border border-gray-200 rounded-xl p-4 hover:border-[#ed1c24] hover:shadow-md transition-all bg-white cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  sz.isFactory ? "bg-[#ed1c24] text-white" : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {sz.isFactory
                                  ? "Factory Fitment"
                                  : "Optional Fitment"}
                              </span>
                              <span className="text-xs font-bold text-[#ed1c24] opacity-0 group-hover:opacity-100 transition-opacity">
                                {"Shop now →"}
                              </span>
                            </div>

                            <div className="text-lg font-black text-gray-900 group-hover:text-[#ed1c24] transition-colors">
                              {sz.label}
                              {sz.speedIndex && <span className="text-gray-400 font-bold ml-1.5 text-sm">{sz.speedIndex}</span>}
                            </div>

                            {sz.rearLabel && (
                              <div className="mt-1 text-xs font-bold text-gray-600">
                                {"Rear: "}
                                {sz.rearLabel}
                                {sz.rearSpeedIndex && (
                                  <span className="text-gray-400 font-bold ml-1">{sz.rearSpeedIndex}</span>
                                )}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-sm font-medium text-gray-500 bg-[#f8f9fa] rounded-2xl border border-gray-100">
      {text}
    </div>
  );
}
