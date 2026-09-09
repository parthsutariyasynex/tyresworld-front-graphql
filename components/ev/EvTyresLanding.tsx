/* ─────────────────────────────────────────────────────────────────
   EV TYRES — supplementary landing content
   Magento's real "EV Tyres" CMS page (identifier electric-vehicle-
   tyres-uae) renders a broken custom template server-side — the
   GraphQL cmsPage query returns a Magento template error string, not
   real content, so there's nothing to decode/reuse here the way the
   Car Services pages work. This section is original copy, written to
   pair with the EV-specific art already sitting unused in
   public/images/ev/ (feature icons, brand logos, the size-guide
   chart) — not transcribed from any Magento source. Rendered as a
   supplementary section after the real, live-data product grid on
   the EV Tyres listing page (see app/[locale]/[...slug]/page.tsx),
   not in place of it.
───────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "/images/ev/low-noise.png",
    title: "Low Noise",
    body: "Denser, more uniform tread compounds cut down on road noise — noticeable in an EV's near-silent cabin.",
  },
  {
    icon: "/images/ev/energy-efficiency.png",
    title: "Energy Efficiency",
    body: "Lower rolling resistance means less energy spent turning the wheels, helping protect your EV's driving range.",
  },
  {
    icon: "/images/ev/durability-icon.png",
    title: "Durability",
    body: "Reinforced construction built to carry an EV's extra battery weight without wearing down early.",
  },
  {
    icon: "/images/ev/performance-icon.png",
    title: "Performance",
    body: "Tuned for an EV's instant torque, so power gets to the road without excess wheel spin.",
  },
  {
    icon: "/images/ev/tire-control.png",
    title: "Handling & Control",
    body: "A stiffer sidewall keeps the car planted through corners, offsetting the extra weight of the battery pack.",
  },
  {
    icon: "/images/ev/wather-icon.png",
    title: "All-Weather Grip",
    body: "Tread patterns designed to stay confident in the rain as well as on dry UAE roads.",
  },
];

const BRANDS = [
  { logo: "/images/ev/michelin-tyres-shop_1.png", name: "Michelin" },
  { logo: "/images/ev/pirelli-tyre-shop_1.png", name: "Pirelli" },
  { logo: "/images/ev/kumho-logo_1.png", name: "Kumho" },
  { logo: "/images/ev/winrun.png", name: "Winrun" },
];

export default function EvTyresLanding() {
  return (
    <section className="bg-white py-12 lg:py-16 border-t border-gray-100">
      <div className="container">
        {/* ── Intro ─────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="font-display uppercase text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-4">
            Why <span className="text-[#ed1c24]">EV Tyres</span> Are Different
          </h2>
          <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed">
            Electric vehicles are heavier, quieter, and put down power differently to a
            combustion car — so their tyres are built to a different brief. EV-rated tyres
            balance low rolling resistance to protect your range, reinforced construction to
            carry the extra battery weight, and a quieter tread to match an EV's near-silent cabin.
          </p>
        </div>

        {/* ── Feature grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 mb-14">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.icon}
                alt=""
                aria-hidden="true"
                className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 object-contain"
              />
              <h3 className="text-[13px] sm:text-sm font-black uppercase tracking-wide text-gray-900 mb-1.5">
                {f.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        {/* ── Size guide ────────────────────────────────────────── */}
        <div className="mb-14">
          <h3 className="text-center text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900 mb-5">
            EV Tyre Size Guide
          </h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ev/tyre-size-guide-chart-new.webp"
            alt="EV tyre size guide chart"
            className="w-full max-w-4xl mx-auto rounded-xl border border-gray-100"
          />
        </div>

        {/* ── Brand strip ───────────────────────────────────────── */}
        <div>
          <h3 className="text-center text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900 mb-6">
            Top EV Tyre Brands We Stock
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {BRANDS.map((b) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={b.name}
                src={b.logo}
                alt={b.name}
                className="h-6 sm:h-7 w-auto object-contain opacity-80"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
