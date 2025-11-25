const legacyOverrides = {
  ':root, :host': {
    '--font-weight-thin': 100,
    '--font-weight-extralight': 200,
    '--font-weight-light': 300,
    '--font-weight-normal': 400,
    '--font-weight-medium': 500,
    '--font-weight-semibold': 600,
    '--font-weight-bold': 700,
    '--font-weight-extrabold': 800,
    '--font-weight-black': 900,
    '--color-gray-50': '#f9fafb',
    '--color-gray-100': '#f3f4f6',
    '--color-gray-200': '#e5e7eb',
    '--color-gray-300': '#d1d5db',
    '--color-gray-400': '#9ca3af',
    '--color-gray-500': '#6b7280',
    '--color-gray-600': '#4b5563',
    '--color-gray-700': '#374151',
    '--color-gray-800': '#1f2937',
    '--color-gray-900': '#111827',
  },
  '.tw-content *, .tw-content ::before, .tw-content ::after': {
    border: '0 solid #e5e7eb',
    'box-sizing': 'border-box',
  },
  '.tw-content *:not(.monaco-code-editor-container):not(.monaco-code-editor-container *)': {
    'font-family': "'Inter', sans-serif !important",
  },
  '.tw-content .font-thin': { 'font-weight': 100 },
  '.tw-content .font-extralight': { 'font-weight': 200 },
  '.tw-content .font-light': { 'font-weight': 300 },
  '.tw-content .font-normal': { 'font-weight': 400 },
  '.tw-content .font-medium': { 'font-weight': 500 },
  '.tw-content .font-semibold': { 'font-weight': 600 },
  '.tw-content .font-bold': { 'font-weight': 700 },
  '.tw-content .font-extrabold': { 'font-weight': 800 },
  '.tw-content .font-black': { 'font-weight': 900 },
  '.tw-content .border': { 'border-width': '1px' },
  '.tw-content .border-0': { 'border-width': 0 },
  '.tw-content .border-2': { 'border-width': '2px' },
  '.tw-content .border-t': {
    'border-top-style': 'solid',
    'border-top-width': '1px',
  },
  '.tw-content .border-r': {
    'border-right-style': 'solid',
    'border-right-width': '1px',
  },
  '.tw-content .border-b': {
    'border-bottom-style': 'solid',
    'border-bottom-width': '1px',
  },
  '.tw-content .border-l': {
    'border-left-style': 'solid',
    'border-left-width': '1px',
  },
  '.tw-content .border-b-0': {
    'border-bottom-style': 'solid',
    'border-bottom-width': 0,
  },
  '.tw-content .border-b-2': {
    'border-bottom-style': 'solid',
    'border-bottom-width': '2px',
  },
  '.no-tailwind, .no-tailwind *': {
    all: 'revert !important',
  },
};

module.exports = legacyOverrides;
