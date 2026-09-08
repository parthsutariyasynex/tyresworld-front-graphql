import { NextResponse } from "next/server";

export async function GET() {
  const homepageData = {
    /* Homepage hero slides.
       `image` is served on desktop, `imageMobile` on mobile screens. */
    banners: [
      {
        id: "slide-shop-tyres-online",
        href: "/tyres",
        image: "/heropage-banner/shop-tyres-online-uae.png",
        imageMobile: "/heropage-banner/shop-tyres-online-uae.png",
        alt: "Shop Tyres Online - And install at our installer network in UAE",
      },
    ],
  };

  return NextResponse.json(homepageData, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
  });
}
