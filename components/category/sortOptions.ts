/** Shared sort options — single source of truth for both the standalone
    toolbar SortBar (CategoryPageInner.tsx) and the red filter bar's own
    sort button (CategoryFilterBar.tsx), so they never drift apart. */
export const SORT_OPTS = [
  { en: "PRICE: LOW TO HIGH", value: "low-to-high" },
  { en: "PRICE: HIGH TO LOW", value: "high-to-low" },
  { en: "Recommended",        value: "recommended" },
];
