"use client";

import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  children: React.ReactNode;
  dir?: "ltr" | "rtl";
}

export default function SearchBar({ children, dir = "ltr" }: SearchBarProps) {
  const [isSticky, setIsSticky] = useState(false);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Capture height before going fixed so placeholder can hold the space
    if (sectionRef.current) {
      setPlaceholderHeight(sectionRef.current.getBoundingClientRect().height);
    }

    const onScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Holds layout space when section goes fixed */}
      {isSticky && (
        <div aria-hidden style={{ height: placeholderHeight }} />
      )}

      <section
        ref={sectionRef}
        className={[
          "container custom-width search-wrap tyreform",
          isSticky ? "tyreform--sticky" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        dir={dir}
      >
        {children}
      </section>
    </>
  );
}
