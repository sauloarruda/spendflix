/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    '../../services/auth/**/*.ts',
  ],
  theme: { extend: {} },
  plugins: [],
};
