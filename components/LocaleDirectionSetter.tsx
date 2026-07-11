"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LocaleDirectionSetter() {
  const pathname = usePathname();

  useEffect(() => {
    const isAr = pathname.split("/")[1] === "ar";
    const html = document.documentElement;
    html.dir = isAr ? "rtl" : "ltr";
    html.lang = isAr ? "ar" : "en";
  }, [pathname]);

  return null;
}
