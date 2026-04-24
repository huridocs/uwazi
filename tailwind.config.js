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
      ...colors,
      primary: colors.indigo,
      success: colors.green,
      error: colors.pink,
      warning: colors.yellow,
      blue: colors.blue,
    },
    extend: {
      colors: {
        blue: colors.indigo,
        alert: {
          50: 'var(--color-alert-50)',
          100: 'var(--color-alert-100)',
          200: 'var(--color-alert-200)',
          300: 'var(--color-alert-300)',
          400: 'var(--color-alert-400)',
          500: 'var(--color-alert-500)',
          600: 'var(--color-alert-600)',
          700: 'var(--color-alert-700)',
          800: 'var(--color-alert-800)',
          900: 'var(--color-alert-900)',
        },
      },
      minWidth: {
        56: '14rem',
      },
      keyframes: {
        dotPulse: {
          '0%, 55%, 100%': { transform: 'scale(1)' },
          '27%': { transform: 'scale(1.5)' },
        },
        dotSpreadLeft: {
          '0%': { transform: 'translateX(6px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        dotSpreadRight: {
          '0%': { transform: 'translateX(-6px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'dot-pulse': 'dotPulse 1.8s ease-in-out infinite',
        'dot-spread-left': 'dotSpreadLeft 0.25s ease-out forwards',
        'dot-spread-right': 'dotSpreadRight 0.25s ease-out forwards',
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

