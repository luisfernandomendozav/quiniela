import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Verde de la Selección Mexicana
        brand: {
          DEFAULT: "#006847",
          dark: "#00543a",
          light: "#0a8a5f",
        },
        // Rojo de la bandera de México
        mxred: {
          DEFAULT: "#ce1126",
          dark: "#a60d1e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
