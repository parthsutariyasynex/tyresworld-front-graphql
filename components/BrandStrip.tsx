"use client";

import Link from "next/link";
import Image from "next/image";

const BRANDS_LIST = [
  { name: "Pirelli", logo: "https://powertire.klever.ae/media/mgs_brand/p/i/pirelli_1.png", value: "pirelli" },
  { name: "Michelin", logo: "https://powertire.klever.ae/media/mgs_brand/m/i/michelin_1.png", value: "michelin" },
  { name: "Continental", logo: "https://powertire.klever.ae/media/mgs_brand/c/o/continental_1_1_.png", value: "continental" },
  { name: "Bridgestone", logo: "https://powertire.klever.ae/media/mgs_brand/b/r/bride_1.png", value: "bridgestone" },
  { name: "BFGoodrich", logo: "https://powertire.klever.ae/media/mgs_brand/b/f/bfgoodrich_1.png", value: "bfgoodrich" },
  { name: "Goodyear", logo: "https://powertire.klever.ae/media/mgs_brand/g/o/goodyear_1_1_.png", value: "goodyear" },
  { name: "Dunlop", logo: "https://powertire.klever.ae/media/mgs_brand/d/u/dunlop_1_1_.png", value: "dunlop" },
  { name: "Hankook", logo: "https://powertire.klever.ae/media/mgs_brand/h/a/hankook_1_1_.png", value: "hankook" },
  { name: "Nexen", logo: "https://powertire.klever.ae/media/mgs_brand/n/e/nexen_1_1_.png", value: "nexen" },
  { name: "Kumho", logo: "https://powertire.klever.ae/media/mgs_brand/k/u/kumho_1_1_.png", value: "kumho" },
  { name: "Toyo Tires", logo: "https://powertire.klever.ae/media/mgs_brand/t/o/toyo_1.png", value: "toyo" },
  { name: "Yokohama", logo: "https://powertire.klever.ae/media/mgs_brand/y/o/yokohama_1.png", value: "yokohama" },
  { name: "Cooper Tires", logo: "https://powertire.klever.ae/media/mgs_brand/c/o/coopertires_1.png", value: "coopertires" },
  { name: "Zeetex", logo: "https://powertire.klever.ae/media/mgs_brand/z/e/zeetex.png", value: "zeetex" },
  { name: "Vredestein", logo: "https://powertire.klever.ae/media/mgs_brand/v/r/vredestein_1.png", value: "vredestein" },
  { name: "Falken", logo: "https://powertire.klever.ae/media/mgs_brand/f/a/falken_1.png", value: "falken" },
  { name: "Roadstone", logo: "https://powertire.klever.ae/media/mgs_brand/r/o/roadstone_1.png", value: "roadstone" },
  { name: "Roadx", logo: "https://powertire.klever.ae/media/mgs_brand/r/o/roadx_1_1_.png", value: "roadx" },
  { name: "Double Coin", logo: "https://powertire.klever.ae/media/mgs_brand/d/o/double-coin.png", value: "double-coin" },
  { name: "Farroad", logo: "https://powertire.klever.ae/media/mgs_brand/f/a/farroad.png", value: "farroad" },
];

export default function BrandStrip() {
  return (
    <section className="relative py-16 lg:py-20 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://powertire.klever.ae/static/frontend/Klever/automotive/en_US/images/brand-banner-new.jpg')" }}>
      {/* Dark overlay to match the textured styling */}
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

      <div className="container relative z-10 max-w-[1380px] mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-white mb-4">
            SHOP BY <span className="text-[#ed1c24]">TYRE BRANDS</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
            Shop top car tyre brands online with PowerTire at the best prices in KSA, supported by a nationwide network of trusted fitment partners.
          </p>
        </div>

        {/* Brands Grid - 5 columns on desktop, responsive down to 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 justify-content-center">
          {BRANDS_LIST.map((brand) => (
            <div key={brand.value} className="w-full">
              <Link
                href={`/shop?categoryUid=MTg=&mgs_brand=${brand.value}`}
                className="flex items-center justify-center bg-white rounded-xl py-3 px-4 h-16 sm:h-20 shadow-md border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 group"
              >
                <div className="relative w-full h-full max-h-[48px] sm:max-h-[58px] flex items-center justify-center">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-w-[85%] max-h-[85%] object-contain filter transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Read More / All Brands button */}
        <div className="flex justify-center mt-10">
          <Link
            href="/brands"
            className="inline-flex items-center justify-center bg-black hover:bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded-full px-8 py-3.5 shadow-lg shadow-black/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-neutral-800"
          >
            All Brands
          </Link>
        </div>

      </div>
    </section>
  );
}
