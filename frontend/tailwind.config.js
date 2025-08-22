/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          900: "#0b1020"
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
