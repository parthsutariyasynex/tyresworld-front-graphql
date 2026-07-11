"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import OffRoadPageInner from "@/components/OffRoadPageInner";
import CategoryPageSkeleton from "@/components/CategoryPageSkeleton";
import { type Locale } from "@/lib/i18n";

export default function OffRoadTiresPage() {
  const pathname = usePathname();
  const locale = (pathname?.split("/")[1] === "ar" ? "ar" : "en") as Locale;

  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <OffRoadPageInner locale={locale} />
    </Suspense>
  );
}
