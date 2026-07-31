/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1220",
          900: "#111A2E",
          800: "#182338",
        },
        brand: {
          50: "#EEF4FF",
          100: "#DCE8FF",
          400: "#4C7EF3",
          500: "#2E5FE0",
          600: "#2249B8",
          700: "#1B3A94",
        },
        ok: { 50: "#ECFDF5", 500: "#12B76A", 700: "#04763B" },
        warn: { 50: "#FFFAEB", 500: "#F79009", 700: "#93370D" },
        bad: { 50: "#FEF3F2", 500: "#F04438", 700: "#B42318" },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.10)",
      },
    },
  },
  plugins: [],
};
