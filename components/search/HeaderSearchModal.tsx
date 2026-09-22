"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  Car,
  FileText,
  Calendar,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";
import { parseTyreSizeInput, buildTyreSizeSlug } from "@/lib/filterBuilder";

export type HeaderSearchModalProps = {
  open: boolean;
  onClose: () => void;
  locale: string;
};

type TabType = "size" | "vehicle" | "brands" | "ev";
type VehStep = "make" | "model" | "year" | "engine";

const ALL_COMMON_TYRE_SIZES = [
  "155 R12C", "155 R12", "155 R13C", "155 R13", "155/70 R13", "155/65 R13", "155/80 R13",
  "165/65 R13", "165/70 R13", "165/65 R14", "165/70 R14", "165/60 R14",
  "175/65 R14", "175/70 R13", "175/70 R14", "175/65 R15", "175/60 R15",
  "185/65 R14", "185/65 R15", "185/60 R15", "185/55 R15", "185/70 R14",
  "195/65 R15", "195/60 R15", "195/55 R15", "195/55 R16", "195/50 R15", "195/50 R16", "195/70 R14", "195/75 R16C",
  "205/55 R16", "205/60 R16", "205/65 R15", "205/65 R16", "205/50 R17", "205/45 R17", "205/70 R15",
  "215/50 R17", "215/50 R18", "215/55 R16", "215/55 R17", "215/55 R18", "215/60 R16", "215/60 R17", "215/65 R16", "215/70 R16", "215/45 R17",
  "225/45 R17", "225/45 R18", "225/50 R17", "225/50 R18", "225/55 R17", "225/55 R18", "225/55 R19", "225/60 R17", "225/60 R18", "225/65 R17", "225/40 R18", "225/40 R19",
  "235/40 R18", "235/40 R19", "235/45 R18", "235/45 R19", "235/50 R18", "235/50 R19", "235/55 R18", "235/55 R19", "235/55 R20", "235/60 R18", "235/65 R17", "235/65 R18",
  "245/40 R18", "245/40 R19", "245/40 R20", "245/45 R18", "245/45 R19", "245/45 R20", "245/50 R19", "245/50 R20", "245/70 R16", "245/75 R16",
  "255/35 R19", "255/35 R20", "255/40 R19", "255/40 R20", "255/45 R19", "255/45 R20", "255/50 R19", "255/50 R20", "255/55 R18", "255/55 R19", "255/55 R20", "255/60 R18", "255/65 R17", "255/70 R16",
  "265/35 R20", "265/40 R20", "265/40 R21", "265/45 R20", "265/45 R21", "265/50 R19", "265/50 R20", "265/60 R18", "265/65 R17", "265/70 R16", "265/70 R17",
  "275/35 R19", "275/35 R20", "275/35 R21", "275/40 R19", "275/40 R20", "275/40 R21", "275/40 R22", "275/45 R20", "275/45 R21", "275/50 R20", "275/55 R19", "275/55 R20", "275/60 R20", "275/65 R18", "275/70 R16",
  "285/30 R20", "285/35 R20", "285/35 R21", "285/35 R22", "285/40 R20", "285/40 R21", "285/40 R22", "285/45 R20", "285/45 R21", "285/45 R22", "285/50 R20", "285/60 R18", "285/65 R17", "285/70 R17",
  "295/30 R20", "295/35 R21", "295/40 R20", "295/40 R21", "295/35 R22", "295/40 R22",
  "305/30 R20", "305/35 R20", "305/30 R21", "305/40 R22",
  "315/30 R21", "315/35 R20", "315/35 R21", "315/35 R22", "315/40 R21",
  "325/30 R21", "325/35 R22"
];

const POPULAR_VEHICLE_MAKES = [
  { name: "Abarth", slug: "abarth", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/abarth.png" },
  { name: "Acura", slug: "acura", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/acura.png" },
  { name: "Alfa Romeo", slug: "alfa-romeo", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/alfa-romeo.png" },
  { name: "Aston Martin", slug: "aston-martin", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/aston-martin.png" },
  { name: "Audi", slug: "audi", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/audi.png" },
  { name: "Avatr", slug: "avatr", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/avatr.png" },
  { name: "BAIC", slug: "baic", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/baic.png" },
  { name: "BAW", slug: "baw", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/baw.png" },
  { name: "Bentley", slug: "bentley", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/bentley.png" },
  { name: "BMW", slug: "bmw", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/bmw.png" },
  { name: "Alpina", slug: "alpina", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/alpina.png" },
  { name: "Borgward", slug: "borgward", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/borgward.png" },
  { name: "Brilliance", slug: "brilliance", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/brilliance.png" },
  { name: "Bugatti", slug: "bugatti", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/bugatti.png" },
  { name: "BYD", slug: "byd", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/byd.png" },
  { name: "Cadillac", slug: "cadillac", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/cadillac.png" },
  { name: "Changan", slug: "changan", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/changan.png" },
  { name: "Chery", slug: "chery", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/chery.png" },
  { name: "Chevrolet", slug: "chevrolet", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/chevrolet.png" },
  { name: "Chrysler", slug: "chrysler", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/chrysler.png" },
  { name: "Citroen", slug: "citroen", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/citroen.png" },
  { name: "Dodge", slug: "dodge", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/dodge.png" },
  { name: "Ferrari", slug: "ferrari", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/ferrari.png" },
  { name: "Fiat", slug: "fiat", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/fiat.png" },
  { name: "Ford", slug: "ford", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/ford.png" },
  { name: "Geely", slug: "geely", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/geely.png" },
  { name: "Genesis", slug: "genesis", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/genesis.png" },
  { name: "GMC", slug: "gmc", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/gmc.png" },
  { name: "Haval", slug: "haval", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/haval.png" },
  { name: "Honda", slug: "honda", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/honda.png" },
  { name: "Hongqi", slug: "hongqi", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/hongqi.png" },
  { name: "Hyundai", slug: "hyundai", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/hyundai.png" },
  { name: "Infiniti", slug: "infiniti", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/infiniti.png" },
  { name: "Jaguar", slug: "jaguar", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/jaguar.png" },
  { name: "Jeep", slug: "jeep", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/jeep.png" },
  { name: "Kia", slug: "kia", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/kia.png" },
  { name: "Lamborghini", slug: "lamborghini", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/lamborghini.png" },
  { name: "Land Rover", slug: "land-rover", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/land-rover.png" },
  { name: "Lexus", slug: "lexus", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/lexus.png" },
  { name: "Lincoln", slug: "lincoln", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/lincoln.png" },
  { name: "Maserati", slug: "maserati", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/maserati.png" },
  { name: "Mazda", slug: "mazda", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mazda.png" },
  { name: "McLaren", slug: "mclaren", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mclaren.png" },
  { name: "Mercedes-Benz", slug: "mercedes-benz", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mercedes-benz.png" },
  { name: "MG", slug: "mg", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mg.png" },
  { name: "Mini", slug: "mini", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mini.png" },
  { name: "Mitsubishi", slug: "mitsubishi", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mitsubishi.png" },
  { name: "Nissan", slug: "nissan", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/nissan.png" },
  { name: "Peugeot", slug: "peugeot", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/peugeot.png" },
  { name: "Polestar", slug: "polestar", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/polestar.png" },
  { name: "Porsche", slug: "porsche", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/porsche.png" },
  { name: "RAM", slug: "ram", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/ram.png" },
  { name: "Renault", slug: "renault", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/renault.png" },
  { name: "Rolls-Royce", slug: "rolls-royce", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/rolls-royce.png" },
  { name: "Skoda", slug: "skoda", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/skoda.png" },
  { name: "Subaru", slug: "subaru", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/subaru.png" },
  { name: "Suzuki", slug: "suzuki", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/suzuki.png" },
  { name: "Tesla", slug: "tesla", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/tesla.png" },
  { name: "Toyota", slug: "toyota", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/toyota.png" },
  { name: "Volkswagen", slug: "volkswagen", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/volkswagen.png" },
  { name: "Volvo", slug: "volvo", logo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/volvo.png" }
];

function normalizeSizeStr(s: string): string {
  return s.toLowerCase().replace(/[\s\/\-_r]/g, "");
}

export default function HeaderSearchModal({
  open,
  onClose,
  locale = "en",
}: HeaderSearchModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("size");
  const [searchVal, setSearchVal] = useState("");
  const [apiSizes, setApiSizes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vehicle Finder State
  const [vehStep, setVehStep] = useState<VehStep>("make");
  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);

  const [vehSearchVal, setVehSearchVal] = useState("");
  const [modelsList, setModelsList] = useState<string[]>([]);
  const [yearsList, setYearsList] = useState<string[]>([]);

  useScrollLock(open);

  useEffect(() => {
    if (!open) {
      setSearchVal("");
      setVehSearchVal("");
      setApiSizes([]);
      setActiveTab("size");
      setVehStep("make");
      setSelectedMake(null);
      setSelectedModel(null);
      setSelectedYear(null);
      setSelectedEngine(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [open, onClose]);

  // Fetch models when make is chosen
  useEffect(() => {
    if (!selectedMake) {
      setModelsList([]);
      return;
    }
    fetch(`/api/tyre-finder/vehicle?step=model&vehicle=${encodeURIComponent(selectedMake)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data.options ?? []).map((o: any) => o.label || o.value || o);
        if (list.length > 0) {
          setModelsList(list);
        } else {
          // Fallback common models
          setModelsList(["Standard", "Sedan", "SUV", "Sport", "GT", "Coupe", "Cross", "Pro"]);
        }
      })
      .catch(() => {
        setModelsList(["Standard", "Sedan", "SUV", "Sport", "GT", "Coupe", "Cross", "Pro"]);
      });
  }, [selectedMake]);

  // Fetch years when model is chosen
  useEffect(() => {
    if (!selectedMake || !selectedModel) {
      setYearsList([]);
      return;
    }
    fetch(`/api/tyre-finder/vehicle?step=year&vehicle=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data.options ?? []).map((o: any) => o.label || o.value || o);
        if (list.length > 0) {
          setYearsList(list);
        } else {
          setYearsList(["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"]);
        }
      })
      .catch(() => {
        setYearsList(["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"]);
      });
  }, [selectedMake, selectedModel]);

  // Live autocomplete from API for tyre sizes
  useEffect(() => {
    const trimmed = searchVal.trim();
    if (trimmed.length < 2) {
      setApiSizes([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(
        `/api/products?search=${encodeURIComponent(
          trimmed
        )}&locale=${locale}&pageSize=35`
      )
        .then((r) => r.json())
        .then((data) => {
          const products = data.products ?? [];
          const extracted = new Set<string>();

          products.forEach((p: any) => {
            if (!p.name) return;
            const stdMatch = p.name.match(
              /(\d{3})\/(\d{2})\s*(?:Z?R)?(\d{2})/i
            );
            if (stdMatch) {
              extracted.add(`${stdMatch[1]}/${stdMatch[2]} R${stdMatch[3]}`);
              return;
            }
            const commMatch = p.name.match(/(\d{3})\s*R(\d{2})C?/i);
            if (commMatch) {
              extracted.add(`${commMatch[1]} R${commMatch[2]}`);
            }
          });

          setApiSizes(Array.from(extracted));
        })
        .catch(() => {});
    }, 180);

    return () => clearTimeout(timer);
  }, [searchVal, locale]);

  // Filter matching size cards
  const matchingSizeCards = useMemo(() => {
    const raw = searchVal.trim();
    if (!raw) return [];

    const norm = normalizeSizeStr(raw);
    const resultSet = new Set<string>();

    ALL_COMMON_TYRE_SIZES.forEach((sz) => {
      const szNorm = normalizeSizeStr(sz);
      if (szNorm.includes(norm) || sz.toLowerCase().includes(raw.toLowerCase())) {
        resultSet.add(sz);
      }
    });

    apiSizes.forEach((sz) => {
      const szNorm = normalizeSizeStr(sz);
      if (szNorm.includes(norm) || sz.toLowerCase().includes(raw.toLowerCase())) {
        resultSet.add(sz);
      }
    });

    return Array.from(resultSet).slice(0, 15);
  }, [searchVal, apiSizes]);

  // Filter vehicle makes
  const filteredMakes = useMemo(() => {
    const q = vehSearchVal.trim().toLowerCase();
    if (!q) return POPULAR_VEHICLE_MAKES;
    return POPULAR_VEHICLE_MAKES.filter((m) => m.name.toLowerCase().includes(q));
  }, [vehSearchVal]);

  // Filter vehicle models
  const filteredModels = useMemo(() => {
    const q = vehSearchVal.trim().toLowerCase();
    if (!q) return modelsList;
    return modelsList.filter((m) => m.toLowerCase().includes(q));
  }, [vehSearchVal, modelsList]);

  // Filter vehicle years
  const filteredYears = useMemo(() => {
    const q = vehSearchVal.trim().toLowerCase();
    if (!q) return yearsList;
    return yearsList.filter((y) => y.toLowerCase().includes(q));
  }, [vehSearchVal, yearsList]);

  if (!open) return null;

  function handleSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = searchVal.trim();
    if (q) {
      onClose();
      const size = parseTyreSizeInput(q);
      router.push(size ? buildTyreSizeSlug(size) : `/${locale}/tyres?q=${encodeURIComponent(q)}`);
    }
  }

  function handleSelectSize(size: string) {
    onClose();
    const parsed = parseTyreSizeInput(size);
    router.push(parsed ? buildTyreSizeSlug(parsed) : `/${locale}/tyres?q=${encodeURIComponent(size)}`);
  }

  function handleTabClick(tab: TabType) {
    setActiveTab(tab);
    if (tab === "vehicle") {
      setVehStep("make");
      setVehSearchVal("");
    } else if (tab === "brands") {
      onClose();
      router.push(`/${locale}/brand`);
    } else if (tab === "ev") {
      onClose();
      router.push(`/${locale}/electric-vehicle-tyres-uae`);
    } else {
      inputRef.current?.focus();
    }
  }

  function handleMakeSelect(make: string) {
    setSelectedMake(make);
    setVehStep("model");
    setVehSearchVal("");
  }

  function handleModelSelect(model: string) {
    setSelectedModel(model);
    setVehStep("year");
    setVehSearchVal("");
  }

  function handleYearSelect(year: string) {
    setSelectedYear(year);
    setVehStep("engine");
    setVehSearchVal("");
  }

  function handleFinishVehicle(engineTrim: string = "All Trims") {
    setSelectedEngine(engineTrim);
    onClose();
    const makeSlug = selectedMake?.toLowerCase().replace(/\s+/g, "-") || "";
    const modelSlug = selectedModel?.toLowerCase().replace(/\s+/g, "-") || "";
    router.push(`/${locale}/tyres/cars?make=${encodeURIComponent(makeSlug)}&model=${encodeURIComponent(modelSlug)}&year=${encodeURIComponent(selectedYear || "")}`);
  }

  const currentSelectionLabel = [selectedMake, selectedModel, selectedYear].filter(Boolean).join(" / ") || "—";

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl min-h-[480px] sm:min-h-[540px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-gray-900 my-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* ══════════════════════════════════════════════════════════
              HEADER
          ══════════════════════════════════════════════════════════ */}
          {activeTab === "vehicle" ? (
            /* Vehicle Popup Header (Exact match to screenshot) */
            <div className="bg-[#ed1c24] text-white px-6 py-5 sm:px-8 sm:py-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                    {"Which vehicle are you looking for?"}
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-white/95 mt-1 font-normal leading-snug">
                    {vehStep === "make"
                      ? "Select the make of your vehicle."
                      : vehStep === "model"
                      ? "Select the model of your vehicle."
                      : vehStep === "year"
                      ? "Select the manufacture year."
                      : "Select engine trim or tyre size."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Current Selection Pill */}
                  <div className="bg-[#851214] rounded-xl px-4 py-2 text-center min-w-[140px] border border-white/20 shadow-inner hidden sm:block">
                    <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-red-200 block leading-tight">
                      CURRENT SELECTION
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-white block mt-0.5 truncate leading-tight">
                      {currentSelectionLabel}
                    </span>
                  </div>

                  {/* Close X */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-white hover:text-white/80 p-1 transition-colors shrink-0 cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={22} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* 4 Step Chips in Red Header (Exact match to screenshot) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
                {/* Chip 1: MAKE */}
                <button
                  type="button"
                  onClick={() => {
                    setVehStep("make");
                    setVehSearchVal("");
                  }}
                  className={`bg-white/10 hover:bg-white/15 rounded-xl p-3 flex items-center gap-3 transition-all text-start cursor-pointer ${
                    vehStep === "make" ? "border-2 border-amber-400 bg-white/20 shadow-sm" : "border border-white/15"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f59e0b] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Car size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-200 block leading-tight">
                      MAKE
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-white block truncate leading-tight">
                      {selectedMake || ("Select")}
                    </span>
                  </div>
                </button>

                {/* Chip 2: MODEL */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMake) {
                      setVehStep("model");
                      setVehSearchVal("");
                    }
                  }}
                  className={`bg-white/10 hover:bg-white/15 rounded-xl p-3 flex items-center gap-3 transition-all text-start cursor-pointer ${
                    vehStep === "model" ? "border-2 border-amber-400 bg-white/20 shadow-sm" : "border border-white/15"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-200 block leading-tight">
                      MODEL
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-white block truncate leading-tight">
                      {selectedModel || ("Select")}
                    </span>
                  </div>
                </button>

                {/* Chip 3: YEAR */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMake && selectedModel) {
                      setVehStep("year");
                      setVehSearchVal("");
                    }
                  }}
                  className={`bg-white/10 hover:bg-white/15 rounded-xl p-3 flex items-center gap-3 transition-all text-start cursor-pointer ${
                    vehStep === "year" ? "border-2 border-amber-400 bg-white/20 shadow-sm" : "border border-white/15"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-200 block leading-tight">
                      YEAR
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-white block truncate leading-tight">
                      {selectedYear || ("Select")}
                    </span>
                  </div>
                </button>

                {/* Chip 4: ENGINE */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMake && selectedModel && selectedYear) {
                      setVehStep("engine");
                      setVehSearchVal("");
                    }
                  }}
                  className={`bg-white/10 hover:bg-white/15 rounded-xl p-3 flex items-center gap-3 transition-all text-start cursor-pointer ${
                    vehStep === "engine" ? "border-2 border-amber-400 bg-white/20 shadow-sm" : "border border-white/15"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center shrink-0">
                    <Settings size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-200 block leading-tight">
                      ENGINE
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-white block truncate leading-tight">
                      {selectedEngine || ("Select")}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Tyre Size Popup Header (Exact match to screenshot) */
            <div className="bg-[#ed1c24] text-white px-6 py-5 sm:px-8 sm:py-6 flex items-start justify-between relative">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                  {"What size are your tyres?"}
                </h3>
                <p className="text-xs sm:text-[13.5px] text-white/95 mt-1 font-normal leading-snug">
                  {"Pick the width — it's the first number on your sidewall (e.g. 235)."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-white hover:text-white/80 p-1 transition-colors shrink-0 ml-4 cursor-pointer"
                aria-label="Close"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MODAL BODY
          ══════════════════════════════════════════════════════════ */}
          <div className="p-5 sm:p-8">
            {/* 4 Black Navigation Tabs (Shown on Tyre Size Search) */}
            {activeTab === "size" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
                {/* Tab 1: Search Tyre Size */}
                <button
                  type="button"
                  onClick={() => handleTabClick("size")}
                  className="px-4 py-3 rounded-xl font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2.5 transition-all cursor-pointer bg-black text-white ring-2 ring-white/20 shadow-md"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                  <span className="truncate">{"Search Tyre Size"}</span>
                </button>

                {/* Tab 2: Search Vehicle */}
                <button
                  type="button"
                  onClick={() => handleTabClick("vehicle")}
                  className="px-4 py-3 rounded-xl font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2.5 transition-all cursor-pointer bg-black/90 hover:bg-black text-white/90"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  <span className="truncate">{"Search Vehicle"}</span>
                </button>

                {/* Tab 3: Tyre Brands */}
                <button
                  type="button"
                  onClick={() => handleTabClick("brands")}
                  className="px-4 py-3 rounded-xl font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2.5 transition-all cursor-pointer bg-black/90 hover:bg-black text-white/90"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="truncate">{"Tyre Brands"}</span>
                </button>

                {/* Tab 4: EV Tyres */}
                <button
                  type="button"
                  onClick={() => handleTabClick("ev")}
                  className="px-4 py-3 rounded-xl font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2.5 transition-all cursor-pointer bg-black/90 hover:bg-black text-white/90"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M13 7l-3 5h4l-2 5" />
                  </svg>
                  <span className="truncate">{"EV Tyres"}</span>
                </button>
              </div>
            )}

            {/* ──── CONTENT: SEARCH TYRE SIZE ──── */}
            {activeTab === "size" && (
              <div>
                <form onSubmit={handleSearchSubmit} className="relative w-full mb-6">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder={
                      "Search Tyre Size e.g 1956515 or 195/65 R15"
                    }
                    className="w-full bg-white border border-gray-200 focus:border-gray-300 rounded-xl px-4 py-3.5 pr-11 text-[13.5px] text-gray-800 placeholder:text-gray-400 focus:outline-none shadow-2xs"
                  />
                  {searchVal && (
                    <button
                      type="button"
                      onClick={() => setSearchVal("")}
                      className="absolute right-11 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#ed1c24] hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
                    aria-label="Search"
                  >
                    <Search size={18} strokeWidth={2.2} />
                  </button>
                </form>

                {/* 5-Column Size Cards Grid */}
                {matchingSizeCards.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    {matchingSizeCards.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSelectSize(sz)}
                        className="bg-white hover:bg-red-50/50 border border-gray-200 hover:border-[#ed1c24] rounded-xl py-3 px-3 text-center font-bold text-xs sm:text-[13.5px] text-gray-900 hover:text-[#ed1c24] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ──── CONTENT: SEARCH VEHICLE ──── */}
            {activeTab === "vehicle" && (
              <div>
                {/* Search Bar (Search here ...) */}
                <div className="relative w-full mb-5">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={vehSearchVal}
                    onChange={(e) => setVehSearchVal(e.target.value)}
                    placeholder={
                      vehStep === "make"
                        ? "Search here ..."
                        : vehStep === "model"
                        ? "Search model ..."
                        : "Search year ..."
                    }
                    className="w-full bg-white border border-gray-200 focus:border-[#ed1c24] rounded-xl pl-10 pr-4 py-3 text-[13.5px] text-gray-800 placeholder:text-gray-400 focus:outline-none transition-colors shadow-2xs"
                  />
                  {vehSearchVal && (
                    <button
                      type="button"
                      onClick={() => setVehSearchVal("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                {/* STEP 1: MAKE GRID (Exact match to screenshot) */}
                {vehStep === "make" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 max-h-[360px] overflow-y-auto pr-1">
                    {filteredMakes.map((m) => {
                      const isSelected = selectedMake === m.name;
                      return (
                        <button
                          key={m.name}
                          type="button"
                          onClick={() => handleMakeSelect(m.name)}
                          className={`bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-all shadow-2xs hover:shadow-xs group ${
                            isSelected
                              ? "border-2 border-[#ed1c24] bg-red-50/20"
                              : "border border-gray-200/90 hover:border-[#ed1c24]"
                          }`}
                        >
                          <div className="h-10 flex items-center justify-center">
                            <img
                              src={m.logo}
                              alt={m.name}
                              className="max-h-8 max-w-[80px] object-contain group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                          <span className="text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-[#ed1c24] transition-colors">
                            {m.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* STEP 2: MODEL GRID */}
                {vehStep === "model" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {filteredModels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleModelSelect(m)}
                        className="bg-white hover:bg-red-50/40 border border-gray-200 hover:border-[#ed1c24] rounded-xl p-4 text-center cursor-pointer transition-all shadow-2xs hover:shadow-xs"
                      >
                        <span className="text-xs sm:text-sm font-bold text-gray-900 hover:text-[#ed1c24]">
                          {m}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 3: YEAR GRID */}
                {vehStep === "year" && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {filteredYears.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => handleYearSelect(y)}
                        className="bg-white hover:bg-[#ed1c24] hover:text-white border border-gray-200 hover:border-[#ed1c24] rounded-xl py-3 px-2 text-center font-bold text-xs sm:text-sm text-gray-900 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 4: ENGINE TRIM / CONFIRM */}
                {vehStep === "engine" && (
                  <div className="space-y-4 py-4 text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 max-w-md mx-auto">
                      <div className="text-xs uppercase font-extrabold text-[#ed1c24] mb-1">
                        Vehicle Fitment Confirmed
                      </div>
                      <h4 className="text-base font-black text-gray-950">
                        {selectedMake} {selectedModel} ({selectedYear})
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Find compatible tyres for this vehicle.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFinishVehicle("Standard")}
                      className="btn-cta gap-2 text-xs sm:text-sm px-8 py-3 rounded-full shadow-md"
                    >
                      <span>{"SEARCH MATCHING TYRES"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            FOOTER BAR
        ══════════════════════════════════════════════════════════ */}
        <div className="px-5 sm:px-8 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          {activeTab === "vehicle" && vehStep !== "make" ? (
            <button
              type="button"
              onClick={() => {
                if (vehStep === "engine") setVehStep("year");
                else if (vehStep === "year") setVehStep("model");
                else if (vehStep === "model") setVehStep("make");
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} className="" />
              <span>{"Back"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (activeTab === "vehicle") {
                  setActiveTab("size");
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} className="" />
              <span>{"Cancel"}</span>
            </button>
          )}

          <div className="text-[11px] text-gray-400">
            TyresWorld UAE
          </div>
        </div>
      </div>
    </div>
  );
}
