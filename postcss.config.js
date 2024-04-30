const tailwindcss = require('tailwindcss');
const prefixSelector = require('postcss-prefix-selector');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    prefixSelector({
      prefix: '.tw-content',
      transform(_prefix, selector, prefixedSelector, filePath, _rule) {
        if (filePath.includes('flowbite.min.css')) {
          return selector;
        }
        return prefixedSelector;
      },
    }),
  ],
};
