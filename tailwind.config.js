/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Calm, mental-wellness-focused palette
        sage: {
          50: '#f6f8f6',
          100: '#e3ebe3',
          200: '#c7d7c7',
          500: '#6b8e6b',
          700: '#4a6b4a',
        },
        warm: {
          50: '#fdfbf7',
          100: '#f5f0e8',
        },
      },
    },
  },
  plugins: [],
};
