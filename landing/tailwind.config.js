/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0C10',
        surface: '#12151E',
        elevated: '#1A1F2C',
        solari: '#F2A900',
        aether: '#00BFFF',
        terra: '#22E07B',
        umbri: '#9B30FF',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        head: ['Outfit', 'sans-serif'],
        body: ['Chivo', 'sans-serif'],
        num: ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
