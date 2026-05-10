import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF9",
        sidebar: "#0B1121",
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
        status: {
          emerald: "#059669",
          amber: "#D97706",
          rose: "#E11D48",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-merriweather)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
