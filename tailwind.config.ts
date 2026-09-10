import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f5ff",
          100: "#dbe7fe",
          200: "#bfd3fe",
          300: "#93b4fd",
          400: "#6090fa",
          500: "#3b6df6",
          600: "#2553eb",
          700: "#1d40d8",
          800: "#1e37af",
          900: "#1e328a",
          950: "#172055",
        },
      },
    },
  },
  plugins: [],
};
export default config;
