const tailwindcss = require('@tailwindcss/postcss');
const prefixSelector = require('postcss-prefix-selector');
const postcssNesting = require('postcss-nesting');

module.exports = (ctx) => {
  const filePath = ctx?.file?.dirname
    ? `${ctx.file.dirname}/${ctx.file.basename || ''}`
    : ctx?.file?.path || ctx?.file || '';

  const plugins = [];

  // Process CSS nesting (for native CSS nesting syntax)
  // This must come before Tailwind CSS processing
  plugins.push(postcssNesting());

  // Always process Tailwind CSS (it will only process files that import Tailwind)
  plugins.push(tailwindcss());

  // Apply prefix selector to scope Tailwind utilities to .tw-content
  // IMPORTANT: Only prefix utility classes, NOT preflight/base styles
  plugins.push(
    prefixSelector({
      prefix: '.tw-content',
      transform(_prefix, selector, prefixedSelector, filePath, _rule) {
        // Don't prefix flowbite styles
        if (filePath && filePath.includes('flowbite.min.css')) {
          return selector;
        }
        // Don't prefix :root or :host (CSS custom properties)
        if (selector === ':root' || selector === ':host') {
          return selector;
        }
        // Don't prefix if already prefixed
        if (selector.startsWith('.tw-content')) {
          return selector;
        }

        // Don't prefix preflight/base styles (element selectors without classes)
        // Preflight uses simple selectors like "button", "input", "*, ::before", etc.
        // These should remain global, not scoped to .tw-content
        // Check if selector is a preflight selector (element selectors, not utility classes)
        const isPreflightSelector =
          // Simple element selectors (button, input, etc.) - no dots, no colons (except pseudo-elements)
          // Match: "button", "input, optgroup", "button, html input[type=button]"
          (!selector.includes('.') && /^[a-z]+/.test(selector.trim())) ||
          // Universal selector (*, ::before, ::after)
          /^\s*\*|^\s*::(before|after|backdrop)/.test(selector) ||
          // Element selectors with pseudo-elements (button::before)
          /^[a-z]+::(before|after|backdrop)/.test(selector) ||
          // Element selectors with attributes (button[disabled], html input[type=button])
          /^[a-z]+(\s+[a-z]+)?\[/.test(selector);

        if (isPreflightSelector) {
          return selector;
        }

        // Don't prefix SCSS nested selectors (multiple dots without spaces = SCSS nesting)
        // Example: .class1.class2 or .parent .child (these are SCSS)
        const hasMultipleDotsNoSpace = selector.split('.').length > 2 && !selector.includes(' ');
        const hasBEM = selector.includes('__') || (selector.includes('--') && !selector.includes(':'));

        // Don't prefix SCSS/BEM selectors
        if (hasMultipleDotsNoSpace || hasBEM) {
          return selector;
        }

        // Prefix utility classes (selectors starting with . that are Tailwind utilities)
        // These are classes like .text-primary-700, .enabled:hover:text-white, etc.
        return prefixedSelector;
      },
    })
  );

  return { plugins };
};
