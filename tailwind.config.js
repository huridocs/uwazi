module.exports = {
  darkMode: 'class',
  content: [
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
    'node_modules/flowbite-datepicker/**/*.{js,jsx,ts,tsx,css}',
  ],
  corePlugins: {
    preflight: true,
  },
  plugins: [
    // eslint-disable-next-line global-require
    require('flowbite/plugin'),
    // eslint-disable-next-line global-require
    require('flowbite-typography'),
  ],
};
