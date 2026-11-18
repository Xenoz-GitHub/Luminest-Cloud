import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          deep: "rgb(var(--accent-deep) / <alpha-value>)",
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
          50: "rgb(var(--accent-soft) / 0.35)",
          100: "rgb(var(--accent-soft) / 0.55)",
          200: "rgb(var(--accent-soft) / 0.8)",
        },
        secondary: "rgb(var(--accent-soft) / <alpha-value>)",
        blush: "#F7DCE8",
        softBlue: "#DCEBFA",
        cream: "#FFF0D8",
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface-2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        success: "#7FC8A9",
        warning: "#F3C677",
        danger: "#E892A2",
      },
      fontFamily: {
        sans: [
          "ui-rounded",
          "Nunito",
          "Quicksand",
          "Varela Round",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 10px 40px -18px rgba(80, 68, 101, 0.25)",
        card: "0 12px 30px -20px rgba(80, 68, 101, 0.35)",
        float: "0 18px 50px -20px rgba(80, 68, 101, 0.4)",
        panel: "0 -12px 60px -20px rgba(80, 68, 101, 0.35)",
        toony: "0 4px 0 0 rgb(var(--line))",
        "toony-sm": "0 2px 0 0 rgb(var(--line))",
        "toony-lg": "0 6px 0 0 rgb(var(--line))",
        "toony-primary": "0 4px 0 0 rgb(var(--accent-deep))",
        "toony-primary-lg": "0 6px 0 0 rgb(var(--accent-deep))",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-7px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-5px)" },
          "40%, 80%": { transform: "translateX(5px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(12px, -16px) scale(1.04)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.75) rotate(0deg)" },
          "50%": { opacity: "1", transform: "scale(1.15) rotate(20deg)" },
        },
        "hero-shake": {
          "0%, 26%, 32%, 100%": {
            transform: "translate3d(0, 0, 0) rotate(0deg)",
          },
          "2%": { transform: "translate3d(-5px, 3px, 0) rotate(-2.5deg)" },
          "5%": { transform: "translate3d(5px, -3px, 0) rotate(2.5deg)" },
          "8%": { transform: "translate3d(-5px, -2px, 0) rotate(-2deg)" },
          "11%": { transform: "translate3d(5px, 2px, 0) rotate(2deg)" },
          "14%": { transform: "translate3d(-4px, 3px, 0) rotate(-2.4deg)" },
          "17%": { transform: "translate3d(4px, -3px, 0) rotate(2.4deg)" },
          "20%": { transform: "translate3d(-3px, 2px, 0) rotate(-1.8deg)" },
          "23%": { transform: "translate3d(3px, -2px, 0) rotate(1.8deg)" },
          "29%": { transform: "translate3d(-1px, 1px, 0) rotate(-0.6deg)" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        wiggle: "wiggle 2.4s ease-in-out infinite",
        pop: "pop 0.35s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        shake: "shake 0.4s ease-in-out",
        drift: "drift 14s ease-in-out infinite",
        twinkle: "twinkle 3.2s ease-in-out infinite",
        "hero-shake": "hero-shake 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
