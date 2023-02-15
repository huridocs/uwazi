const tailwindcss = require('tailwindcss');
const prefixSelector = require('postcss-prefix-selector');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    prefixSelector({
      prefix: '.tw-content',
    }),
  ],
};
