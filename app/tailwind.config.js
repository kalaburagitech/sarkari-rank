// Brand navy sampled from the Astraa logo (mirrors palette.primary in constants/theme.ts).
const navy = {
  50: "#EEF3FC",
  100: "#DAE5F8",
  200: "#B7CBF1",
  300: "#8AA9E5",
  400: "#5A82D3",
  500: "#2F60BE",
  600: "#1A49A3",
  700: "#0B3A8C",
  800: "#0A2F72",
  900: "#08275E",
  950: "#051A40",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: navy,
        // Many screens hardcode `indigo-*`; alias it to the brand navy.
        indigo: navy,
        secondary: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        accent: {
          50: "#FFF8E5",
          100: "#FEEDBF",
          400: "#FFBA2E",
          500: "#F5A300",
          600: "#D48A00",
        },
        // App surface tokens used by dark-mode utility classes.
        ink: {
          DEFAULT: "#0F172A",
          soft: "#1E293B",
          card: "#111a2e",
          bg: "#0B1120",
        },
      },
    },
  },
  plugins: [],
};
