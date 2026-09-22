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
  /** Real per-weekday time slots (index 0 = Sunday..6 = Saturday) parsed
      server-side from Magento's own opening_hours field — see
      /api/store-locator. Empty day array means genuinely closed that day. */
  openingHoursByDay?: string[][];
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function StoreLocatorMap({
  stores,
  selectedStoreId,
  userCoords,
  onSelectStore,
  locale = "en",
}: {
  stores: StoreLocation[];
  selectedStoreId: string | null;
  userCoords?: { lat: number; lng: number } | null;
  onSelectStore: (store: StoreLocation) => void;
  locale?: string;
}) {
  const [activeStore, setActiveStore] = useState<StoreLocation | null>(null);
  const [focusMode, setFocusMode] = useState<"store" | "user">("store");

  // When userCoords updates (e.g. user clicked "Use my location"), focus map on user location
  const prevCoordsRef = useRef<string | null>(null);
  useEffect(() => {
    if (userCoords) {
      const coordKey = `${userCoords.lat.toFixed(5)},${userCoords.lng.toFixed(5)}`;
      if (prevCoordsRef.current !== coordKey) {
        prevCoordsRef.current = coordKey;
        setFocusMode("user");
      }
    }
  }, [userCoords]);

  // When selectedStoreId changes, focus map on the selected store
  const prevStoreIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedStoreId) {
      const found = stores.find((s) => s.id === selectedStoreId);
      if (found) {
        setActiveStore(found);
        if (prevStoreIdRef.current !== selectedStoreId) {
          prevStoreIdRef.current = selectedStoreId;
          setFocusMode("store");
        }
      }
    } else if (stores.length > 0 && !activeStore && !userCoords) {
      setActiveStore(stores[0]);
    }
  }, [selectedStoreId, stores, activeStore, userCoords]);

  // Google Maps embed URL with markers
  const mapEmbedUrl =
    focusMode === "user" && userCoords
      ? `https://maps.google.com/maps?q=${userCoords.lat},${userCoords.lng}&z=14&output=embed`
      : activeStore
      ? `https://maps.google.com/maps?q=${activeStore.lat},${activeStore.lng}&z=15&output=embed`
      : userCoords
      ? `https://maps.google.com/maps?q=${userCoords.lat},${userCoords.lng}&z=14&output=embed`
      : `https://maps.google.com/maps?q=24.3548,54.4988&z=11&output=embed`;

  return (
    <div className="relative w-full h-[520px] lg:h-full min-h-[480px] bg-slate-100 rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col">
      {/* Top Map Controls Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden text-xs font-bold">
        <button
          type="button"
          className="px-3.5 py-1.5 bg-white text-gray-900 font-bold hover:bg-gray-50 border-r border-gray-200"
        >
          {"Map"}
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 bg-white text-gray-600 hover:text-black hover:bg-gray-50 font-medium"
        >
          {"Satellite"}
        </button>
      </div>

      {/* Interactive Google Map Frame */}
      <iframe
        key={focusMode === "user" && userCoords ? `user-${userCoords.lat}-${userCoords.lng}` : activeStore ? `store-${activeStore.id}-${activeStore.lat}-${activeStore.lng}` : "default"}
        title="Store Locator Map"
        src={mapEmbedUrl}
        className="w-full flex-1 border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Floating Selected Store Card Overlay (Only when a store is focused) */}
      {focusMode === "store" && activeStore && (
        <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:right-auto sm:max-w-sm z-10 bg-white rounded-2xl border border-gray-100 p-3 sm:p-3.5 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-emerald-300 bg-white flex items-center justify-center shadow-2xs">
              <img
                src="/img/independent-badge.png"
                alt="Partner Badge"
                className="w-full h-full object-contain p-1"
              />
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-block bg-[#ffebee] text-[#ed1c24] text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full mb-0.5 tracking-wider">
                {activeStore.badge || "CERTIFIED PARTNER"}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-gray-950 uppercase line-clamp-1 leading-snug">
                {activeStore.name}
              </h4>
              <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                {activeStore.address}
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeStore.lat},${activeStore.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#ed1c24] hover:bg-[#c6181d] text-white rounded-xl flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
              title="Get Directions"
            >
              <Navigation size={18} className="fill-white text-white rotate-45" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
