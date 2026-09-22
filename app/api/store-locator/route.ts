import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { magentoFetch } from "@/lib/graphql/client";
import { KLEVER_INSTALLER_STORES_QUERY } from "@/lib/queries";
import { getStores, KleverStoreItem } from "@/lib/services/stores.service";

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  external_link?: string;
  installer_type?: string;
  delivery_mode?: string;
  shipping_amount?: string | null;
  openingHoursByDay: string[][];
}

export interface MobileVanLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  shipping_amount?: string | null;
  shipping_fee?: string;
  installer_type?: string;
  delivery_mode?: string;
  openingHoursByDay: string[][];
}

function cleanText(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\\/g, "").replace(/\s+/g, " ").trim();
}

function to12Hour(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  if (!Number.isFinite(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${(mStr ?? "00").padStart(2, "0")} ${period}`;
}

/** Magento's opening_hours: a JSON string of 7 day-entries, each itself a
    JSON string of [start,end] 24h pairs (or "[]"/"" when closed that day). */
function parseOpeningHoursByDay(raw?: string | null): string[][] {
  if (!raw) return [];
  try {
    const days: unknown = JSON.parse(raw);
    if (!Array.isArray(days)) return [];
    return days.map((d): string[] => {
      if (typeof d !== "string" || !d.trim()) return [];
      try {
        const pairs: unknown = JSON.parse(d);
        if (!Array.isArray(pairs)) return [];
        return pairs
          .filter((p): p is [string, string] => Array.isArray(p) && p.length === 2)
          .map(([start, end]) => `${to12Hour(start)} - ${to12Hour(end)}`);
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

function cleanAddressString(address?: string | null, city?: string | null, country?: string | null): string {
  const cAddress = cleanText(address).replace(/,\s*$/, "").replace(/-\s*$/, "").trim();
  const cCity = cleanText(city);
  const cCountry = cleanText(country);

  const parts: string[] = [];
  if (cAddress) parts.push(cAddress);
  if (cCity && !cAddress.toLowerCase().includes(cCity.toLowerCase())) parts.push(cCity);
  if (cCountry && !cAddress.toLowerCase().includes(cCountry.toLowerCase())) parts.push(cCountry);

  return parts.length > 0 ? parts.join(", ") : cCity || "UAE";
}

async function fetchAllStores(locale: string): Promise<{
  branches: Branch[];
  mobileVans: MobileVanLocation[];
  cities: string[];
}> {
  // 1. Try public store locator query (kleverStores)
  const storesData = await getStores({ store: locale, pageSize: 100 });
  const rawItems = storesData?.items || [];

  if (rawItems.length > 0) {
    const branches: Branch[] = [];
    const mobileVans: MobileVanLocation[] = [];

    for (const i of rawItems) {
      const lat = i.latitude != null ? Number(i.latitude) : NaN;
      const lng = i.longitude != null ? Number(i.longitude) : NaN;
      const name = cleanText(i.name);
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const rawAddress = i.address;
      const rawCity = i.city;
      const city = cleanText(rawCity);
      const address = cleanAddressString(rawAddress, city, i.country);
      const phone = cleanText(i.phone) || undefined;
      const whatsapp = phone ? phone.replace(/[^0-9]/g, "") : undefined;
      const openingHours = parseOpeningHoursByDay(i.opening_hours);

      const isMobile =
        i.delivery_mode === "mobilevan" ||
        i.is_mobilevan === 1 ||
        name.toLowerCase().includes("mobile van");

      const storeId = i.stores_id != null ? String(i.stores_id) : `${name}-${lat}-${lng}`;

      if (isMobile) {
        const shipAmt = i.shipping_amount != null && i.shipping_amount !== "" ? String(i.shipping_amount) : null;
        mobileVans.push({
          id: storeId,
          name,
          city: city || name.replace(/^Mobile Van Installation\s*-\s*/i, "").trim(),
          address: address || city,
          lat,
          lng,
          phone,
          whatsapp,
          email: cleanText(i.email) || undefined,
          shipping_amount: shipAmt,
          shipping_fee: shipAmt ? `AED ${Number(shipAmt).toFixed(2)}` : undefined,
          installer_type: cleanText(i.installer_type) || "mobile_installer.png",
          delivery_mode: "mobilevan",
          openingHoursByDay: openingHours,
        });
      } else {
        branches.push({
          id: storeId,
          name,
          address,
          city,
          lat,
          lng,
          phone,
          whatsapp,
          email: cleanText(i.email) || undefined,
          external_link: cleanText(i.external_link) || undefined,
          installer_type: cleanText(i.installer_type) || "independent_installer.png",
          delivery_mode: "outlet",
          shipping_amount: i.shipping_amount != null ? String(i.shipping_amount) : null,
          openingHoursByDay: openingHours,
        });
      }
    }

    const citySet = new Set<string>();
    for (const b of branches) {
      if (b.city) citySet.add(b.city);
    }
    for (const v of mobileVans) {
      if (v.city) citySet.add(v.city);
    }

    const cities = Array.from(citySet).sort((a, b) => a.localeCompare(b));
    return { branches, mobileVans, cities };
  }

  // 2. Fallback to installer stores query
  const r = await magentoFetch<{
    kleverInstallerStores?: {
      stores_id?: number;
      name?: string;
      city?: string;
      address?: string;
      country?: string;
      latitude?: string | number;
      longitude?: string | number;
      opening_hours?: string | null;
    }[] | null;
  }>(
    KLEVER_INSTALLER_STORES_QUERY,
    { deliveryMode: "outlet" },
    { store: locale, revalidate: 300 }
  );

  const fallbackItems = r.data?.kleverInstallerStores ?? [];
  const branches: Branch[] = fallbackItems
    .map((i) => {
      const lat = i.latitude != null ? Number(i.latitude) : NaN;
      const lng = i.longitude != null ? Number(i.longitude) : NaN;
      const name = cleanText(i.name);
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const city = cleanText(i.city);
      return {
        id: i.stores_id != null ? String(i.stores_id) : `${name}-${lat}-${lng}`,
        name,
        address: cleanAddressString(i.address, city, i.country),
        city,
        lat,
        lng,
        openingHoursByDay: parseOpeningHoursByDay(i.opening_hours),
      };
    })
    .filter((b): b is Branch => b !== null);

  const cities = Array.from(new Set(branches.map((b) => b.city).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );

  return { branches, mobileVans: [], cities };
}

export async function GET(_req: NextRequest) {
  const locale = "en";
  const allLabel = "All";

  let timeSlots: string[] = [];
  try {
    const jsonPath = path.join(process.cwd(), "public", "data", "store-locator.json");
    const fileContent = await fs.readFile(jsonPath, "utf-8");
    const parsed = JSON.parse(fileContent);
    const localeConfig = parsed[locale] ?? parsed.en;
    timeSlots = localeConfig.timeSlots ?? [];
  } catch (err) {
    console.error("Failed to read store locator config JSON:", err);
  }

  if (!timeSlots || timeSlots.length === 0) {
    timeSlots = [
      "09:00 AM - 11:00 AM",
      "11:00 AM - 01:00 PM",
      "02:00 PM - 04:00 PM",
      "04:00 PM - 06:00 PM",
      "06:00 PM - 08:00 PM",
    ];
  }

  const deliveryOptions = [
    {
      id: "install_outlet",
      title: "Install at Outlet",
      description: "Visit our outlet for professional installation",
      icon: "store",
    },
    {
      id: "mobile_van",
      title: "Mobile Van Service",
      description: "Our mobile van comes to your location",
      icon: "truck",
    },
    {
      id: "free_shipping",
      title: "Free Shipping",
      description: "Delivery without fitment service",
      icon: "package",
    },
  ];

  try {
    const { branches, mobileVans, cities } = await fetchAllStores(locale);

    return NextResponse.json(
      {
        cities: [allLabel, ...cities],
        branches,
        mobileVans,
        deliveryOptions,
        timeSlots,
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } }
    );
  } catch (err) {
    console.error("Failed to fetch pickup locations from Magento:", err);
    return NextResponse.json(
      {
        cities: [allLabel],
        branches: [],
        mobileVans: [],
        deliveryOptions,
        timeSlots,
        error: "Store locations unavailable",
      },
      { status: 200 }
    );
  }
}

