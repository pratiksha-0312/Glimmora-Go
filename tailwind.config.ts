import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef7ee",
          100: "#fdecd7",
          200: "#fbd5ad",
          300: "#f8b679",
          400: "#f48d43",
          500: "#f16c1e",
          600: "#e25313",
          700: "#bb3e12",
          800: "#953217",
          900: "#782b16",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
