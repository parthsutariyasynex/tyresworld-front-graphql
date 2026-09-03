import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      /* Colours are NOT defined here — they resolve to the CSS custom
         properties in app/globals.css, which is the single source of
         truth for brand tokens. Edit the hex values there, never here. */
      colors: {
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          soft: "rgb(var(--c-asphalt) / <alpha-value>)",
          muted: "rgb(var(--c-gravel) / <alpha-value>)",
        },
        brand: {
          red: "rgb(var(--c-red) / <alpha-value>)",
          amber: "rgb(var(--c-amber) / <alpha-value>)",
          asphalt: "rgb(var(--c-asphalt) / <alpha-value>)",
          paper: "rgb(var(--c-paper) / <alpha-value>)",
          gravel: "rgb(var(--c-gravel) / <alpha-value>)",
          line: "rgb(var(--c-line) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--c-red) / <alpha-value>)",
          soft: "rgb(var(--c-amber) / <alpha-value>)",
        },
        cream: "rgb(var(--c-surface-2) / <alpha-value>)",
      },
      fontFamily: {
        kanit: ["Kanit", "sans-serif"],
        sans: ["Kanit", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Kanit", "var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -8px rgba(16, 24, 40, 0.08)",
        cardHover:
          "0 1px 2px rgba(16, 24, 40, 0.06), 0 18px 40px -12px rgba(16, 24, 40, 0.18)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      height: {
        18: "4.5rem",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.4,0,0.2,1)",
        "slide-in-left": "slide-in-left 0.35s cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
