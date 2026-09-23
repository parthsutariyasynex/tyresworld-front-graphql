"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface OverviewDrawerContextType {
  isOpen: boolean;
  openDrawer: (section?: string) => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
}

const OverviewDrawerContext = createContext<OverviewDrawerContextType>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  activeSection: null,
  setActiveSection: () => {},
});

export function OverviewDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const openDrawer = useCallback((section?: string) => {
    if (section) setActiveSection(section);
    setIsOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <OverviewDrawerContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        activeSection,
        setActiveSection,
      }}
    >
      {children}
    </OverviewDrawerContext.Provider>
  );
}

export function useOverviewDrawer() {
  return useContext(OverviewDrawerContext);
}
