"use client";
export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import CategoryPageSkeleton from "@/components/CategoryPageSkeleton";
import { type Locale } from "@/lib/i18n";

export default function RunFlatTiresPage() {
  const params = useParams();
  const locale = (params.locale ?? "en") as Locale;

  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <CategoryPageInner
        urlKey="run-flat-tires"
        locale={locale}
        heroTitle="SHOP RUN-FLAT TYRES ONLINE ACROSS KSA"
        heroTitleAr="تسوق إطارات رن فلات عبر الإنترنت في المملكة العربية السعودية"
      />
    </Suspense>
  );
}
