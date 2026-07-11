"use client";
export const dynamic = 'force-dynamic';

import { useParams } from "next/navigation";
import { Suspense } from "react";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import { type Locale } from "@/lib/i18n";

export default function OffRoadTiresPage() {
  const params = useParams();
  const locale = (params.locale ?? "en") as Locale;

  return (
    <Suspense fallback={<div className="container py-20 text-center text-gray-400 animate-pulse">Loading…</div>}>
      <CategoryPageInner
        urlKey="off-road-tires-4x4"
        locale={locale}
        heroTitle="SHOP OFF-ROAD & 4X4 TYRES ACROSS KSA"
        heroTitleAr="تسوق إطارات الطرق الوعرة و4×4 في المملكة العربية السعودية"
      />
    </Suspense>
  );
}
