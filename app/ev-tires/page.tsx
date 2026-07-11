"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import EvPageInner from "@/components/EvPageInner";
import CategoryPageSkeleton from "@/components/CategoryPageSkeleton";
import { type Locale } from "@/lib/i18n";

export default function EvTiresPage() {
  const pathname = usePathname();
  const locale = (pathname?.split("/")[1] === "ar" ? "ar" : "en") as Locale;

  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <EvPageInner locale={locale} />
    </Suspense>
  );
}
