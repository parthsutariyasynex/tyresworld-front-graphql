"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MapPin, Search, Truck, Wrench, Clock, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const formatted = d.toLocaleDateString("en-US", { day: '2-digit', month: '2-digit', year: 'numeric' });
    const weekday = d.toLocaleDateString("en-US", { weekday: 'long' });
    days.push(`${formatted} (${weekday})`);
  }
  return days;
}

function InstallerCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-white flex flex-col justify-between animate-pulse">
      <div className="flex flex-col gap-2.5">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex items-start gap-1.5 mt-1">
          <div className="w-4 h-4 bg-gray-250/60 rounded-full flex-shrink-0" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
        <div className="flex gap-2.5 mt-3">
          <div className="h-[38px] bg-gray-200 rounded-lg w-28" />
          <div className="w-[38px] h-[38px] bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function StoreLocatorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split("/")[1] === "ar" ? "ar" : "en") as Locale;
  const isAr = locale === "ar";

  const [activeTab, setActiveTab] = useState<"branch" | "location" | "delivery">("branch");
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [mobileAddress, setMobileAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateOptions, setDateOptions] = useState<string[]>([]);

  // API states
  const [branches, setBranches] = useState<any[]>([]);
  const [mobileVans, setMobileVans] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Clear selection on tab change
  useEffect(() => {
    setSelectedBranch(null);
  }, [activeTab]);

  useEffect(() => {
    const days = getNext7Days();
    setDateOptions(days);
    if (days[0]) setSelectedDate(days[0]);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const res = await fetch(`/api/store-locator?locale=${locale}`);
        const data = await res.json();
        if (active && data) {
          setBranches(data.branches || []);
          setMobileVans(data.mobileVans || []);
          setTimeSlots(data.timeSlots || []);
          if (data.timeSlots?.[0]) setSelectedTime(data.timeSlots[0]);
        }
      } catch (e) {
        console.error("Failed to load store locator data", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [locale]);

  const handleBookBranch = (branchId: string) => {
    setSelectedBranch(branchId);
  };

  const handleProceed = () => {
    const isMobile = activeTab === "location";
    const selectedVanObj = isMobile ? mobileVans.find(v => v.id === selectedBranch) : null;
    const selectedBranchObj = activeTab === "branch" ? branches.find(b => b.id === selectedBranch) : null;

    const installation = {
      type: activeTab,
      branch: selectedBranchObj,
      van: selectedVanObj,
      date: activeTab !== "delivery" ? selectedDate : null,
      time: activeTab !== "delivery" ? selectedTime : null,
      mobileAddress: isMobile ? mobileAddress : null,
    };
    localStorage.setItem("selected_installation", JSON.stringify(installation));
    router.push(`/${locale}/checkout`);
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="bg-[#f8f8f8] min-h-screen pb-16">
      {/* Header Banner */}
      <div
        className="relative bg-black py-14 lg:py-20 text-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.45)), url('/img/store-locator-banner.png')`,
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-xl sm:text-2xl lg:text-[34px] font-black uppercase tracking-wide text-white leading-tight">
            {t(locale, "storelocator.headerTitle")}
          </h1>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100 py-3.5 mb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <nav className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {t(locale, "storelocator.breadcrumbHome")}
            </Link>
            <span className="text-gray-400 font-normal">&gt;</span>
            <span className="text-black">{t(locale, "storelocator.breadcrumbStore")}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-10 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={t(locale, "storelocator.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-800 transition-colors"
            />
          </div>
          <button className="bg-[#ed1c24] hover:bg-[#c6181d] text-white font-extrabold text-[11px] uppercase tracking-widest px-6 py-3.5 rounded-lg transition-colors whitespace-nowrap">
            {t(locale, "storelocator.searchButton")}
          </button>
          <button className="bg-black hover:bg-gray-900 text-white font-extrabold text-[11px] uppercase tracking-widest px-6 py-3.5 rounded-lg transition-colors whitespace-nowrap">
            {t(locale, "storelocator.viewAllInMap")}
          </button>
        </div>

        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black uppercase tracking-wider text-gray-900">
            {t(locale, "storelocator.selectInstaller")}
          </h2>
          <p className="text-gray-500 text-xs mt-2 font-medium">
            {t(locale, "storelocator.subtitle")}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Branch Tab */}
          <div
            onClick={() => setActiveTab("branch")}
            className={`flex-1 min-w-0 flex items-center gap-3 py-3.5 px-4 border rounded-lg cursor-pointer transition-all duration-200 bg-white text-xs font-bold uppercase tracking-wider select-none ${
              activeTab === "branch" ? "border-[#ed1c24] text-black shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            <span className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
              activeTab === "branch" ? "border-[#ed1c24]" : "border-gray-300"
            }`}>
              {activeTab === "branch" && <span className="w-2.5 h-2.5 rounded-full bg-[#ed1c24]" />}
            </span>
            <span>{t(locale, "storelocator.fitAtBranch")}</span>
          </div>

          {/* Location Tab */}
          <div
            onClick={() => setActiveTab("location")}
            className={`flex-1 min-w-0 flex items-center gap-3 py-3.5 px-4 border rounded-lg cursor-pointer transition-all duration-200 bg-white text-xs font-bold uppercase tracking-wider select-none ${
              activeTab === "location" ? "border-[#ed1c24] text-black shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            <span className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
              activeTab === "location" ? "border-[#ed1c24]" : "border-gray-300"
            }`}>
              {activeTab === "location" && <span className="w-2.5 h-2.5 rounded-full bg-[#ed1c24]" />}
            </span>
            <span>{t(locale, "storelocator.fitAtLocation")}</span>
          </div>

          {/* Delivery Tab */}
          <div
            onClick={() => setActiveTab("delivery")}
            className={`flex-1 min-w-0 flex items-center gap-3 py-3.5 px-4 border rounded-lg cursor-pointer transition-all duration-200 bg-white text-xs font-bold uppercase tracking-wider select-none ${
              activeTab === "delivery" ? "border-[#ed1c24] text-black shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            <span className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
              activeTab === "delivery" ? "border-[#ed1c24]" : "border-gray-300"
            }`}>
              {activeTab === "delivery" && <span className="w-2.5 h-2.5 rounded-full bg-[#ed1c24]" />}
            </span>
            <span>{t(locale, "storelocator.homeDelivery")}</span>
          </div>
        </div>

        {/* Loader/Skeleton */}
        {loading ? (
          <div className="mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <InstallerCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Tab 1 Content: Branch List */}
            {activeTab === "branch" && (
              <div className="mt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBranches.map((branch, index) => {
                    const isSelected = selectedBranch === branch.id;
                    return (
                      <div
                        key={branch.id}
                        data-markerid={index}
                        data-storeid={branch.id}
                        className={`p-5 rounded-xl border transition-all duration-200 bg-white flex flex-col justify-between ${
                          isSelected
                            ? "border-[#ed1c24] bg-white shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-col gap-2.5">
                          <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{branch.name}</div>
                          <div className="text-xs text-gray-500 flex items-start gap-1.5 leading-relaxed">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span>{branch.address}</span>
                          </div>
                          
                          {!isSelected ? (
                            <div className="flex gap-2.5 mt-3 items-center">
                              <button
                                type="button"
                                onClick={() => handleBookBranch(branch.id)}
                                className="bg-[#ed1c24] hover:bg-[#c6181d] text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-5 rounded-lg transition-colors duration-200 border-none cursor-pointer"
                              >
                                {t(locale, "storelocator.bookNow")}
                              </button>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.name + " " + branch.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border border-gray-200 hover:border-gray-300 w-[38px] h-[38px] rounded-full flex items-center justify-center text-red-500 hover:text-red-650 bg-white transition-colors flex-shrink-0"
                                title={t(locale, "storelocator.seeOnMap")}
                              >
                                <MapPin className="w-4 h-4 text-[#ed1c24]" />
                              </a>
                            </div>
                          ) : (
                            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    {t(locale, "storelocator.selectDate")}
                                  </label>
                                  <select
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border border-gray-300 bg-white rounded-md px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-red-650 transition-colors"
                                  >
                                    {dateOptions.map((day) => (
                                      <option key={day} value={day}>{day}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    {t(locale, "storelocator.selectTime")}
                                  </label>
                                  <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="border border-gray-300 bg-white rounded-md px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-red-650 transition-colors"
                                  >
                                    {timeSlots.map((slot) => (
                                      <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={handleProceed}
                                  className="flex-1 bg-[#ed1c24] hover:bg-[#c6181d] text-white font-extrabold text-[11px] uppercase tracking-widest py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                  {t(locale, "storelocator.proceedToCheckout")}
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedBranch(null)}
                                  className="bg-white text-gray-700 border border-gray-300 font-semibold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg cursor-pointer no-underline inline-flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900"
                                >
                                  {t(locale, "storelocator.cancel")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2 Content: Fit at Location List */}
            {activeTab === "location" && (
              <div className="mt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mobileVans.map((van, index) => {
                    const isSelected = selectedBranch === van.id;
                    return (
                      <div
                        key={van.id}
                        data-markerid={index}
                        data-storeid={van.id}
                        className={`p-5 rounded-xl border transition-all duration-200 bg-white flex flex-col justify-between ${
                          isSelected
                            ? "border-[#ed1c24] bg-white shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-col gap-2.5">
                          <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{van.name}</div>
                          <div className="text-xs text-gray-500 flex items-start gap-1.5 leading-relaxed">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span>{van.address}</span>
                          </div>

                          <div className="bg-[#edf5ff] border border-[#d2e4ff] text-[#0052cc] rounded px-3 py-2 text-xs font-semibold flex items-center gap-2 mt-1 w-fit">
                            <span>{t(locale, "storelocator.mobilityFee")}</span>
                            <span className="font-bold text-[#ed1c24]">{van.fee}</span>
                          </div>
                          
                          {!isSelected ? (
                            <div className="flex gap-2.5 mt-3">
                              <button
                                type="button"
                                onClick={() => handleBookBranch(van.id)}
                                className="bg-[#ed1c24] hover:bg-[#c6181d] text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-5 rounded-lg transition-colors duration-200 border-none cursor-pointer"
                              >
                                {t(locale, "storelocator.bookNow")}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 font-bold">
                                  {t(locale, "storelocator.enterAddress")}
                                </label>
                                <textarea
                                  placeholder={t(locale, "storelocator.addressPlaceholder")}
                                  rows={3}
                                  value={mobileAddress}
                                  onChange={(e) => setMobileAddress(e.target.value)}
                                  className="w-full border border-gray-350 bg-white rounded-md px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-650 transition-colors resize-none"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1 font-bold">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    {t(locale, "storelocator.selectDate")}
                                  </label>
                                  <select
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border border-gray-300 bg-white rounded-md px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-red-650 transition-colors"
                                  >
                                    {dateOptions.map((day) => (
                                      <option key={day} value={day}>{day}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1 font-bold">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    {t(locale, "storelocator.selectTime")}
                                  </label>
                                  <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="border border-gray-300 bg-white rounded-md px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-red-650 transition-colors"
                                  >
                                    {timeSlots.map((slot) => (
                                      <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={handleProceed}
                                  disabled={!mobileAddress.trim()}
                                  className="flex-1 bg-[#ed1c24] hover:bg-[#c6181d] text-white font-extrabold text-[11px] uppercase tracking-widest py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {t(locale, "storelocator.proceedToCheckout")}
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedBranch(null)}
                                  className="bg-white text-gray-700 border border-gray-300 font-semibold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg cursor-pointer no-underline inline-flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900"
                                >
                                  {t(locale, "storelocator.cancel")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3 Content: Home Delivery */}
            {activeTab === "delivery" && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-xl mx-auto text-center mt-5">
                <Truck className="w-12 h-12 text-[#ed1c24] mx-auto mb-4" />
                <h3 className="text-base font-black text-gray-900 mb-2 uppercase">
                  {t(locale, "storelocator.homeDeliveryDetails")}
                </h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  {t(locale, "storelocator.homeDeliveryText")}
                </p>
                <button
                  onClick={handleProceed}
                  className="w-full bg-[#ed1c24] hover:bg-[#c6181d] text-white font-extrabold text-[11px] uppercase tracking-widest py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {t(locale, "storelocator.proceedToCheckout")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
