import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#14202E", soft: "#4A5868", faint: "#7B8794" },
        paper: "#F3F5F8",
        line: "#DDE3EA",
        brand: { DEFAULT: "#2A4FD8", dark: "#1F3BAA", tint: "#EAF0FF", edge: "#BFD0FF" },
        alert: { DEFAULT: "#B42318", tint: "#FDECEA", edge: "#F5B8B2" },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto",
          "Helvetica Neue", "Arial", "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
