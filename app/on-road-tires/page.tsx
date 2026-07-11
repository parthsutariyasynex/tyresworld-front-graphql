"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import OnRoadPageInner from "@/components/OnRoadPageInner";
import CategoryPageSkeleton from "@/components/CategoryPageSkeleton";
import { type Locale } from "@/lib/i18n";

export default function OnRoadTiresPage() {
  const pathname = usePathname();
  const locale = (pathname?.split("/")[1] === "ar" ? "ar" : "en") as Locale;

  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <OnRoadPageInner locale={locale} />
    </Suspense>
  );
}
