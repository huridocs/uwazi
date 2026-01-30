const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const prefixWrap = require('postcss-prefixwrap');
const postcssNesting = require('postcss-nesting');
const legacyOverrides = require('./app/react/App/styles/legacyOverrides.cjs');

module.exports = ctx => {
  const filePath = ctx?.file?.dirname
    ? `${ctx.file.dirname}/${ctx.file.basename || ''}`
    : ctx?.file?.path || ctx?.file || '';
  const isTailwindFile = /app\/react\/App\/styles\/tailwind\.css$/.test(filePath);

  const plugins = [];

  plugins.push(postcssNesting());
  plugins.push(tailwindcss());

  const unwrapTailwindLayers = () => ({
    postcssPlugin: 'uwazi-unwrap-tailwind-layers',
    AtRule: {
      layer: atRule => {
        if (!atRule.nodes || !atRule.nodes.length) {
          atRule.remove();
          return;
        }

        const layerName = atRule.params?.trim();
        if (['properties', 'theme', 'base', 'components', 'utilities'].includes(layerName)) {
          atRule.replaceWith(atRule.nodes);
        }
      },
    },
  });
  unwrapTailwindLayers.postcss = true;

  const injectLegacyOverrides = () => ({
    postcssPlugin: 'uwazi-legacy-overrides',
    Once(root) {
      if (!legacyOverrides) return;
      const rules = Object.entries(legacyOverrides)
        .map(([selector, declarations]) => {
          const body = Object.entries(declarations)
            .map(([property, value]) => `  ${property}: ${value};`)
            .join('\n');
          return `${selector} {\n${body}\n}`;
        })
        .join('\n');
      root.append(postcss.parse(rules));
    },
  });
  injectLegacyOverrides.postcss = true;

  const stripDarkMediaQueries = () => ({
    postcssPlugin: 'uwazi-strip-dark-media',
    AtRule: {
      media: atRule => {
        if (/\(prefers-color-scheme:\s*dark\)/i.test(atRule.params || '')) {
          atRule.remove();
        }
      },
    },
  });
  stripDarkMediaQueries.postcss = true;

  if (isTailwindFile) {
    plugins.push(unwrapTailwindLayers());

    plugins.push(
      prefixWrap('.tw-content', {
        ignoredSelectors: [':root', ':host'],
        prefixTransform: (selector, prefix) => {
          const trimmed = selector.trim();
          if (trimmed.startsWith(prefix)) {
            return selector;
          }
          return `${prefix} ${selector}`;
        },
      })
    );

    plugins.push(stripDarkMediaQueries());
    plugins.push(injectLegacyOverrides());
  }

  return { plugins };
};
