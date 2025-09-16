/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This array TELLS TAILWIND WHICH FILES TO SCAN for CSS classes.
    // If it's empty, Tailwind generates almost no CSS.
    // It should include all your component files.
    "./src/**/*.{js,jsx,ts,tsx}", // <--- **THIS LINE IS CRITICAL!**
    "./public/index.html",       // <--- If you have classes in index.html
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}