"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Check, ArrowLeft } from "lucide-react";
import { buildFilterParams } from "@/lib/filterBuilder";
import {
  fetchMakes,
  fetchModels,
  fetchYears,
  fetchTrims,
  fetchSizes,
  type VehicleOption,
  type VehicleSize,
} from "@/lib/vehicleFinderApi";

/* Matches the allow-list the homepage TyreFinder uses when building the
   /tyres search URL (components/TyreFinder.tsx SIZE_FIELDS) — kept as a
   small local constant rather than importing from that component, since
   it isn't exported and this page must not touch that file. */
const SIZE_FIELDS = ["width", "height", "rim", "rear_width", "rear_height", "rear_rim"];

type Step = "model" | "year" | "trim";

export default function VehicleMakeBrowserPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params.locale ?? "en");
  const isAr = locale === "ar";
  const make = String(params.make ?? "");

  const [step, setStep] = useState<Step>("model");

  const [makeInfo, setMakeInfo] = useState<VehicleOption | null>(null);
  const [makeLoading, setMakeLoading] = useState(true);

  const [models, setModels] = useState<VehicleOption[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selModel, setSelModel] = useState<VehicleOption | null>(null);

  const [years, setYears] = useState<VehicleOption[] | null>(null);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [selYear, setSelYear] = useState<string>("");

  const [trims, setTrims] = useState<VehicleOption[] | null>(null);
  const [trimsLoading, setTrimsLoading] = useState(false);
  const [selTrim, setSelTrim] = useState<VehicleOption | null>(null);

  const [sizes, setSizes] = useState<VehicleSize[] | null>(null);
  const [sizesLoading, setSizesLoading] = useState(false);

  /* ── make label + logo (from the same makes list the browser page uses) ── */
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
  }, [make, locale]);

  /* ── years once a model is picked ── */
  useEffect(() => {
    if (!selModel) {
      setYears(null);
      return;
    }
    let active = true;
    const ctrl = new AbortController();
    setYearsLoading(true);
    fetchYears(make, selModel.value, locale, ctrl.signal)
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
  }, [make, selModel, locale]);

  /* ── trims once a year is picked ── */
  useEffect(() => {
    if (!selModel || !selYear) {
      setTrims(null);
      return;
    }
    let active = true;
    const ctrl = new AbortController();
    setTrimsLoading(true);
    setSelTrim(null);
    fetchTrims(make, selModel.value, selYear, locale, ctrl.signal)
      .then(({ options }) => {
        if (!active) return;
        setTrims(options);
        // Mirror the homepage finder's UX: the first trim is pre-selected
        // so the compatible sizes show immediately, without forcing an
        // extra click when there's only one (or an obvious first) option.
        if (options.length) setSelTrim(options[0]);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setTrimsLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [make, selModel, selYear, locale]);

  /* ── sizes for the selected trim ── */
  useEffect(() => {
    if (!selModel || !selYear || !selTrim) {
      setSizes(null);
      return;
    }
    let active = true;
    const ctrl = new AbortController();
    setSizesLoading(true);
    fetchSizes(make, selModel.value, selYear, selTrim.value, locale, ctrl.signal)
      .then(({ sizes }) => {
        if (active) setSizes(sizes);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSizesLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [make, selModel, selYear, selTrim, locale]);

  function pickModel(m: VehicleOption) {
    setSelModel(m);
    setSelYear("");
    setSelTrim(null);
    setSizes(null);
    setStep("year");
  }

  function pickYear(y: string) {
    setSelYear(y);
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
    router.push(`/${locale}/tyres?${buildFilterParams(filterObj, SIZE_FIELDS)}`);
  }

  const makeLabel = makeInfo?.label ?? (make ? make.charAt(0).toUpperCase() + make.slice(1).replace(/-/g, " ") : "");

  const heroTitle = useMemo(() => {
    if (isAr) return `إطارات ${makeLabel || "..."} — اختر الموديل والسنة`;
    return `${makeLabel || "…"} Tyres — Select Model & Year`;
  }, [isAr, makeLabel]);

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* ── Hero ── */}
      <div
        className="page-title-wrapper py-9 sm:py-11 text-center bg-black"
        style={{
          backgroundImage: "url('/img/shopping-cart-banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="title flex items-center justify-center gap-3">
            {makeInfo?.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={makeInfo.logo}
                alt=""
                className="h-9 w-auto max-w-[48px] object-contain bg-white rounded p-1"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-white tracking-wider font-sans">
              <span className="base">{heroTitle}</span>
            </h1>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap font-medium">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight size={12} className="shrink-0 text-gray-400" />
            <Link href={`/${locale}/tyres`} className="hover:text-black transition-colors">
              {isAr ? "الإطارات" : "Tyres"}
            </Link>
            <ChevronRight size={12} className="shrink-0 text-gray-400" />
            <Link href={`/${locale}/tyres/cars`} className="hover:text-black transition-colors">
              {isAr ? "السيارات" : "Cars"}
            </Link>
            <ChevronRight size={12} className="shrink-0 text-gray-400" />
            {selModel ? (
              <button onClick={backToModel} className="hover:text-black transition-colors">
                {makeLabel}
              </button>
            ) : (
              <span className="text-black font-semibold">{makeLabel}</span>
            )}
            {selModel && (
              <>
                <ChevronRight size={12} className="shrink-0 text-gray-400" />
                {selYear ? (
                  <button onClick={backToYear} className="hover:text-black transition-colors">
                    {selModel.label}
                  </button>
                ) : (
                  <span className="text-black font-semibold">{selModel.label}</span>
                )}
              </>
            )}
            {selYear && (
              <>
                <ChevronRight size={12} className="shrink-0 text-gray-400" />
                <span className="text-black font-semibold">{selYear}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* ── LEFT: vehicle fitment summary ── */}
        <div className="border border-gray-200 rounded-xl bg-[#f8f9fa] p-5 lg:sticky lg:top-24">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-3">
            {isAr ? "ملاءمة المركبة" : "Vehicle Fitment"}
          </p>
          <div className="space-y-3">
            <FitStep label={isAr ? "الماركة" : "Make"} value={makeLabel} done />
            <FitStep
              label={isAr ? "الموديل" : "Model"}
              value={selModel?.label}
              done={!!selModel}
              active={step === "model"}
            />
            <FitStep
              label={isAr ? "السنة" : "Year"}
              value={selYear}
              done={!!selYear}
              active={step === "year"}
            />
            <FitStep
              label={isAr ? "الفئة والمقاس" : "Trim & Size"}
              value={selTrim?.label}
              done={!!sizes?.length}
              active={step === "trim"}
            />
          </div>
        </div>

        {/* ── RIGHT: current step ── */}
        <div>
          {step === "model" && (
            <StepPanel title={isAr ? "اختر الموديل" : "Choose a Model"} loading={makeLoading || modelsLoading}>
              {modelsError && (models ?? []).length === 0 ? (
                <EmptyState
                  text={isAr ? "تعذر تحميل الموديلات." : "Couldn't load models."}
                />
              ) : (models ?? []).length === 0 && !modelsLoading ? (
                <EmptyState
                  text={
                    isAr
                      ? `لا توجد موديلات متاحة لـ ${makeLabel}.`
                      : `No models available for ${makeLabel}.`
                  }
                />
              ) : (
                <OptionGrid options={models ?? []} onPick={pickModel} />
              )}
            </StepPanel>
          )}

          {step === "year" && selModel && (
            <StepPanel
              title={isAr ? `اختر السنة — ${selModel.label}` : `Choose Year — ${selModel.label}`}
              loading={yearsLoading}
              onBack={backToModel}
            >
              {(years ?? []).length === 0 && !yearsLoading ? (
                <EmptyState text={isAr ? "لا توجد سنوات متاحة." : "No years available."} />
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {(years ?? []).map((y) => (
                    <button
                      key={y.value}
                      type="button"
                      onClick={() => pickYear(y.value)}
                      className="min-w-[76px] px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-900 hover:border-[#ed1c24] hover:text-[#ed1c24] transition-colors"
                    >
                      {y.label}
                    </button>
                  ))}
                </div>
              )}
            </StepPanel>
          )}

          {step === "trim" && selModel && selYear && (
            <StepPanel
              title={
                isAr
                  ? `الفئة والمقاسات — ${selModel.label} (${selYear})`
                  : `Trim & Tyre Sizes — ${selModel.label} (${selYear})`
              }
              loading={trimsLoading}
              onBack={backToYear}
            >
              {(trims ?? []).length === 0 && !trimsLoading ? (
                <EmptyState text={isAr ? "لا توجد فئات متاحة." : "No trims available."} />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(trims ?? []).map((tr) => {
                      const isSel = selTrim?.value === tr.value;
                      return (
                        <button
                          key={tr.value}
                          type="button"
                          onClick={() => setSelTrim(tr)}
                          className={`px-4 py-2 rounded-lg border text-sm font-bold transition-colors flex items-center gap-2 ${
                            isSel
                              ? "border-[#ed1c24] bg-[#ed1c24] text-white"
                              : "border-gray-200 bg-white text-gray-900 hover:border-gray-400"
                          }`}
                        >
                          {tr.label}
                          {tr.hp != null && (
                            <span className={`text-[11px] font-medium ${isSel ? "text-white/80" : "text-gray-400"}`}>
                              {tr.hp}hp
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
                    {isAr ? "مقاسات الإطارات المتوافقة" : "Compatible Tyre Sizes"}
                  </p>

                  {sizesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (sizes ?? []).length === 0 ? (
                    <EmptyState
                      text={
                        isAr
                          ? "لا توجد مقاسات متوافقة لهذه الفئة."
                          : "No compatible tyre sizes found for this trim."
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(sizes ?? []).map((sz, idx) => (
                        <button
                          key={`${sz.label}-${sz.rearLabel ?? ""}-${idx}`}
                          type="button"
                          onClick={() => pickSize(sz)}
                          className="text-left border border-gray-200 rounded-lg p-4 hover:border-[#ed1c24] hover:shadow-sm transition-all bg-white"
                        >
                          <span
                            className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                              sz.isFactory ? "bg-[#851214] text-white" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {sz.isFactory
                              ? isAr ? "مقاس المصنع" : "Factory Fitment"
                              : isAr ? "مقاس اختياري" : "Optional Fitment"}
                          </span>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-base font-black text-gray-900">
                              {sz.label}
                              {sz.speedIndex && <span className="text-gray-400 font-bold ml-1">{sz.speedIndex}</span>}
                            </span>
                          </div>
                          {sz.rearLabel && (
                            <div className="mt-1 text-sm font-bold text-gray-600">
                              {isAr ? "خلفي: " : "Rear: "}
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
                </>
              )}
            </StepPanel>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── small presentational helpers ─────────────────────────────────── */

function FitStep({
  label,
  value,
  done,
  active,
}: {
  label: string;
  value?: string | null;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${active ? "" : ""}`}>
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          done ? "bg-emerald-500 text-white" : active ? "bg-[#ed1c24] text-white" : "bg-gray-200 text-gray-400"
        }`}
      >
        {done ? <Check size={12} strokeWidth={3} /> : <span className="text-[10px] font-black">•</span>}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

function StepPanel({
  title,
  loading,
  onBack,
  children,
}: {
  title: string;
  loading?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function OptionGrid({ options, onPick }: { options: VehicleOption[]; onPick: (o: VehicleOption) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o)}
          className="px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-900 text-left hover:border-[#ed1c24] hover:text-[#ed1c24] transition-colors"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-gray-500 bg-[#f8f9fa] rounded-lg border border-gray-100">{text}</div>;
}
