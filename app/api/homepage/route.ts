import { NextRequest, NextResponse } from "next/server";
import { getHomepageData } from "@/lib/services/homepage.service";
import { storeCode } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const store = storeCode("en");

  const homepage = await getHomepageData(store);

  const banners = [
    {
      id: "slide-shop-tyres-online",
      href: "/tyres",
      image: "/heropage-banner/shop-tyres-online-uae.png",
      imageMobile: "/heropage-banner/shop-tyres-online-uae.png",
      alt: "Shop Tyres Online - And install at our installer network in UAE",
    },
  ];

  return NextResponse.json(
    {
      banners,
      offers: homepage?.offers ?? null,
      howItWorks: homepage?.how_it_works ?? null,
      services: homepage?.services ?? null,
      topReasons: homepage?.top_reasons ?? null,
      about: homepage?.about ?? null,
    },
    { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
  );
}
