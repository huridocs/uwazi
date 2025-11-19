/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'class',
  content: [
    './app/react/**/*.{js,jsx,ts,tsx}',
    './app/react/stories/**/*.{js,jsx,ts,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
    'node_modules/flowbite-datepicker/**/*.{js,jsx,ts,tsx,css}',
  ],
  theme: {
    fontFamily: {
      sans: [
        'Inter',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
      ],
      body: [
        'Inter',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
      ],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace',
      ],
    },
    colors: {
      primary: colors.indigo,
      success: colors.green,
      error: colors.pink,
      warning: colors.yellow,
      blue: colors.blue,
    },
    extend: {
      colors: {
        blue: colors.indigo,
      },
      minWidth: {
        56: '14rem',
      },
    },
  },
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

