/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
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
        'system-ui',
        'Segoe UI',
        'Roboto',
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
        'system-ui',
        'Segoe UI',
        'Roboto',
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
        'form-error-border': '#843534',
      },
      minWidth: {
        56: '14rem',
      },
      boxShadow: {
        'form-focus': 'inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6)',
        'form-error': 'inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 6px #ce8483',
      },
    },
  },
  plugins: [
    {
      preflight: false,
    },
    // eslint-disable-next-line global-require
    require('flowbite/plugin'),
    // eslint-disable-next-line global-require
    require('flowbite-typography'),
  ],
};
