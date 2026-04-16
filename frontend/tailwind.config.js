/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Segoe UI", "sans-serif"]
      },
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        ember: "#f97316",
        pine: "#14532d"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.14)"
      }
    },
  },
  plugins: [],
}
