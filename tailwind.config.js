/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/react/ComponentLibrary/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    {
      preflight: false,
    },
  ],
  prefix: 'tw-',
};
