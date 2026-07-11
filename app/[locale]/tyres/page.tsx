"use client";
export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import CategoryPageSkeleton from "@/components/CategoryPageSkeleton";
import { type Locale } from "@/lib/i18n";

export default function TyresPage() {
  const params = useParams();
  const locale = (params.locale ?? "en") as Locale;

  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <CategoryPageInner
        urlKey="tyres"
        locale={locale}
        heroTitle="SHOP ALL TYPES OF TYRES ONLINE ACROSS KSA"
        heroTitleAr="تسوق جميع أنواع الإطارات عبر الإنترنت في المملكة العربية السعودية"
      />
    </Suspense>
  );
}
