"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Phone, MessageSquare, ExternalLink, MapPin } from "lucide-react";

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  defaultDistanceKm?: number;
  distanceKm?: number;
  phone?: string;
  whatsapp?: string;
  badge?: string;
  openingHours?: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function StoreLocatorMap({
  stores,
  selectedStoreId,
  onSelectStore,
  locale = "en",
}: {
  stores: StoreLocation[];
  selectedStoreId: string | null;
  onSelectStore: (store: StoreLocation) => void;
  locale?: string;
}) {
  const isAr = locale === "ar";
  const [activeStore, setActiveStore] = useState<StoreLocation | null>(null);

  // Sync with prop
  useEffect(() => {
    if (selectedStoreId) {
      const found = stores.find((s) => s.id === selectedStoreId);
      if (found) setActiveStore(found);
    } else if (stores.length > 0 && !activeStore) {
      setActiveStore(stores[0]);
    }
  }, [selectedStoreId, stores]);

  // Center point
  const currentCenter = activeStore
    ? { lat: activeStore.lat, lng: activeStore.lng }
    : stores.length > 0
    ? { lat: stores[0].lat, lng: stores[0].lng }
    : { lat: 24.4539, lng: 54.3773 };

  // Google Maps embed URL with markers
  const mapEmbedUrl = activeStore
    ? `https://maps.google.com/maps?q=${activeStore.lat},${activeStore.lng}&z=15&output=embed`
    : `https://maps.google.com/maps?q=24.3548,54.4988&z=11&output=embed`;

  return (
    <div className="relative w-full h-[520px] lg:h-full min-h-[480px] bg-slate-100 rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col">
      {/* Top Map Controls Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden text-xs font-bold">
        <button
          type="button"
          className="px-3.5 py-1.5 bg-white text-gray-900 font-bold hover:bg-gray-50 border-r border-gray-200"
        >
          {isAr ? "خريطة" : "Map"}
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 bg-white text-gray-600 hover:text-black hover:bg-gray-50 font-medium"
        >
          {isAr ? "قمر صناعي" : "Satellite"}
        </button>
      </div>

      {/* Interactive Google Map Frame */}
      <iframe
        title="Store Locator Map"
        src={mapEmbedUrl}
        className="w-full flex-1 border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Floating Selected Store Card Overlay */}
      {activeStore && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-10 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/90 p-3.5 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-emerald-300/80 bg-white flex items-center justify-center">
              <img
                src="/img/independent-badge.png"
                alt="Independent Installer"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block bg-red-100 text-[#ed1c24] text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full mb-1 tracking-wider">
                {activeStore.badge || "CERTIFIED PARTNER"}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-gray-950 uppercase line-clamp-1 leading-snug">
                {activeStore.name}
              </h4>
              <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
                {activeStore.address}
              </p>
              {activeStore.openingHours && (
                <p className="text-[10px] text-emerald-700 font-bold mt-1">
                  ● Open: {activeStore.openingHours}
                </p>
              )}
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeStore.lat},${activeStore.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-8 h-8 rounded-lg bg-[#ed1c24] text-white flex items-center justify-center hover:bg-black transition-colors shadow-2xs"
              title="Get Directions"
            >
              <Navigation size={14} className="stroke-[2.5]" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
