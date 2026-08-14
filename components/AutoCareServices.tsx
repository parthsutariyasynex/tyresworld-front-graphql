"use client";

import { useEffect, useState } from "react";

/* ── API types ──────────────────────────────────────────────────── */
type ServiceItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  iconImage: string;
};

/* ──────────────────────────────────────────────────────────────────
   Skeleton — matches live card shape exactly
────────────────────────────────────────────────────────────────── */
function ServiceCardSkeleton() {
  return (
    <div
      className="relative animate-pulse"
      style={{ minHeight: "150px", paddingLeft: "132px" }}
    >
      {/* Image placeholder — overflows container vertically */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-xl bg-gray-500 z-10"
        style={{ width: "168px", height: "192px" }}
      />
      {/* Dark content placeholder */}
      <div
        className="rounded-xl flex flex-col justify-center pl-12 pr-5 py-5 gap-2.5"
        style={{ background: "#555555", minHeight: "150px" }}
      >
        <div className="h-3 w-2/3 rounded bg-gray-500" />
        <div className="h-2.5 w-full rounded bg-gray-600" />
        <div className="h-2.5 w-5/6 rounded bg-gray-600" />
        <div className="h-2.5 w-3/5 rounded bg-gray-600" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Live card
   Layout:  image (abs, overflows vert) | dark-box (normal flow)
   The image is 168px wide; paddingLeft 132px leaves 36px overlap
   where the dark box left edge slides behind the image.
────────────────────────────────────────────────────────────────── */
function ServiceCard({ item }: { item: ServiceItem }) {
  return (
    <div
      className="service-box relative transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_14px_36px_rgba(0,0,0,0.38)]"
      style={{ minHeight: "150px", paddingLeft: "132px" }}
    >
      {/* ── Image — absolutely positioned, overflows top & bottom ── */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-xl overflow-hidden z-10"
        style={{ width: "168px", height: "192px" }}
      >
        {item.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.image}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-600" />
        )}

        {/* Dark overlay + rotating round shape + fixed centered icon */}
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
          {/* Rotating background shape (spins continuously behind the icon) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/round-shape.webp"
            alt=""
            aria-hidden
            className="service-shape"
          />
          {item.iconImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.iconImage}
              alt={item.title}
              className="service-icon w-14 h-14 object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
              loading="lazy"
            />
          )}
        </div>
      </div>

      {/* ── Dark content box ───────────────────────────────────── */}
      <div
        className="rounded-xl flex flex-col justify-center pl-12 pr-5 py-5"
        style={{ background: "#555555", minHeight: "150px" }}
      >
        <h3 className="text-white font-black text-[12px] tracking-[0.13em] uppercase mb-2 leading-tight">
          {item.title}
        </h3>
        <p className="text-white/75 text-[11px] leading-[1.65]">
          {item.description}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Section
────────────────────────────────────────────────────────────────── */
export default function AutoCareServices() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => { if (active) setServices(data.services ?? []); })
      .catch(() => { })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const items: (ServiceItem | null)[] = loading
    ? [null, null, null, null, null]
    : services;

  return (
    <section className="py-20 lg:py-24 bg-white border-y border-ink/5">
      <div className="container">

        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-wide leading-tight">
            <span className="text-ink">YOUR TRUSTED </span>
            <span className="text-[#ed1c24]">AUTO CARE DESTINATION</span>
          </h2>
          <p className="text-sm text-ink/50 mt-3 font-medium">
            Reliable service, trusted brands, and expert care for every drive.
          </p>
        </div>

        {/* Desktop — 6-col grid: row 1 = 3 cards (col-span-2 each),
                                  row 2 = 2 cards centred (cols 2–3, 4–5) */}
        <div className="hidden lg:grid grid-cols-6 gap-x-5 gap-y-12">
          {items.slice(0, 3).map((item, i) => (
            <div key={item?.id ?? i} className="col-span-2">
              {item ? <ServiceCard item={item} /> : <ServiceCardSkeleton />}
            </div>
          ))}
          <div className="col-start-2 col-span-2">
            {items[3] ? <ServiceCard item={items[3]} /> : <ServiceCardSkeleton />}
          </div>
          <div className="col-span-2">
            {items[4] ? <ServiceCard item={items[4]} /> : <ServiceCardSkeleton />}
          </div>
        </div>

        {/* Tablet — 2-col grid */}
        <div className="hidden sm:grid lg:hidden grid-cols-2 gap-x-5 gap-y-12">
          {items.map((item, i) =>
            item ? <ServiceCard key={item.id} item={item} /> : <ServiceCardSkeleton key={i} />
          )}
        </div>

        {/* Mobile — 1-col */}
        <div className="grid sm:hidden gap-y-12">
          {items.map((item, i) =>
            item ? <ServiceCard key={item.id} item={item} /> : <ServiceCardSkeleton key={i} />
          )}
        </div>

      </div>
    </section>
  );
}
