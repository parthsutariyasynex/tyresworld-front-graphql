/** Brand design tokens — JS constants used in components that need inline styles.
 *  CSS counterparts are in app/globals.css as CSS variables (--brand-red etc.).
 */
export const THEME = {
  colors: {
    brandRed:     "#ed1c24",
    brandRedDark: "#c6181d",
    black:        "#111111",
    darkBg:       "#1a1a1a",
    white:        "#ffffff",
    grayText:     "#6b7280",
    grayBorder:   "#e5e7eb",
    grayBg:       "#f9fafb",
    greenWA:      "#25D366",
    greenWADark:  "#1ebe5c",
    tabby:        "#00B67A",
    tamaraPurple: "#7B2FBE",
  },

  radii: {
    card: "0.75rem",  // rounded-xl
    pill: "9999px",   // rounded-full
    sm:   "0.5rem",   // rounded-lg
  },
} as const;
