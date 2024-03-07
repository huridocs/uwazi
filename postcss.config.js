const tailwindcss = require('tailwindcss');
const prefixSelector = require('postcss-prefix-selector');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    prefixSelector({
      prefix: '.tw-content',
      // Optional transform callback for case-by-case overrides
      transform(prefix, selector, prefixedSelector, filePath, rule) {
        if (filePath.includes('flowbite.min.css')) {
          return selector;
        }
        return prefixedSelector;
      },
    }),
  ],
};
