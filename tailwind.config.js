/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/react/ComponentLibrary/*.{js,jsx,ts,tsx}',
    './app/react/stories/*.{js,jsx,ts,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    {
      preflight: false,
    },
    // eslint-disable-next-line global-require
    require('flowbite/plugin'),
  ],
};
