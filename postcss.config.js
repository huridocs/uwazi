import tailwindcss from 'tailwindcss';
import prefixSelector from 'postcss-prefix-selector';

module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    prefixSelector({
      prefix: '.tw-content',
    }),
  ],
};
