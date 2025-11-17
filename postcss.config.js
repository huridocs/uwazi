const tailwindcss = require('@tailwindcss/postcss');
const prefixSelector = require('postcss-prefix-selector');

module.exports = (ctx) => {
  const filePath = ctx?.file?.dirname
    ? `${ctx.file.dirname}/${ctx.file.basename || ''}`
    : ctx?.file?.path || '';
  const isGlobalsCss = filePath.includes('globals.css');

  const plugins = [];

  if (!isGlobalsCss) {
    plugins.push(tailwindcss());
  }

  plugins.push(
    prefixSelector({
      prefix: '.tw-content',
      transform(_prefix, selector, prefixedSelector, filePath, _rule) {
        if (filePath && filePath.includes('flowbite.min.css')) {
          return selector;
        }
        if (selector === ':root' || selector === ':host') {
          return selector;
        }
        return prefixedSelector;
      },
    })
  );

  return { plugins };
};
