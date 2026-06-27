/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#f8f9ff",
        foreground: "#121c2a",
        primary: {
          DEFAULT: "#006492",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#006a62",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#d9e3f6",
          foreground: "#3f4850",
        },
        accent: {
          DEFAULT: "#eaf1ff",
          foreground: "#006492",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#121c2a",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#121c2a",
        },
        surface: {
          DEFAULT: "#f8f9ff",
          dim: "#d0dbed",
          bright: "#f8f9ff",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
