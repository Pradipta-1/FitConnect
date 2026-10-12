import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Redefine slate from bluish-navy to FitConnect's dark obsidian & emerald-tinted theme
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#3b4742",
          700: "#222c27",
          800: "#151b18",
          900: "#0d1310",
          950: "#060907",
        },
        brand: {
          primary: "#00c896",
          glow: "rgba(0, 200, 150, 0.2)",
          dark: "#060907",
          card: "#0d1310",
          border: "rgba(0, 200, 150, 0.15)",
        }
      }
    }
  },
  plugins: []
};

export default config;
