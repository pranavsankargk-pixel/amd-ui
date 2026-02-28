/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./app/components/**/*.{js,ts,jsx,tsx}", "./app/lib/**/*.{js,ts}", "./app/*.{js,ts,jsx,tsx}"] ,
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        accent: "#f97316",
        background: "#0a0f1e",
        card: "#1e293b",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
