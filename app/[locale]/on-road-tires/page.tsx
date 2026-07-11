"use client";
export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import { type Locale } from "@/lib/i18n";

export default function OnRoadTiresPage() {
  const params = useParams();
  const locale = (params.locale ?? "en") as Locale;

  return (
    <Suspense fallback={<div className="container py-20 text-center text-gray-400 animate-pulse">Loading…</div>}>
      <CategoryPageInner
        urlKey="on-road-tires"
        locale={locale}
        heroTitle="SHOP ON-ROAD TYRES ONLINE ACROSS KSA"
        heroTitleAr="تسوق إطارات الطريق عبر الإنترنت في المملكة العربية السعودية"
      />
    </Suspense>
  );
}
