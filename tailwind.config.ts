import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1e2430",
        mist: "#f4f1e8",
        sand: "#e3dac8",
        clay: "#c2674e",
        forest: "#35594a",
        steel: "#6d7a8b",
      },
      boxShadow: {
        panel: "0 20px 60px rgba(30, 36, 48, 0.10)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
