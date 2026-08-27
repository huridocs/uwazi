// oxlint JS plugin: local/require-js-extension
//
// Port of the ESLint custom rule `local/require-js-extension` (previously
// defined inline in eslint.config.mjs) so oxlint can enforce it via jsPlugins.
//
// The backend (app/api) is transpiled file-by-file to ESM and run by Node ESM,
// which requires explicit `.js` extensions in relative imports. This rule
// enforces that convention in TS source (the `.js` refers to the compiled
// output file).
//
// Loaded from .oxlintrc.json via `jsPlugins` and scoped to `app/api/**/*.ts`
// through an override (mirroring the ESLint config).

module.exports = {
  rules: {
    'require-js-extension': {
      meta: {
        type: 'problem',
        fixable: 'code',
        schema: [],
        messages: {
          missingJsExtension:
            "Relative import '{{source}}' is missing the .js extension.",
        },
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const { value } = node.source;
            if (!value.startsWith('./') && !value.startsWith('../')) return;
            const lastSegment = value.split('/').pop();
            if (lastSegment && lastSegment.includes('.')) return;
            context.report({
              node: node.source,
              messageId: 'missingJsExtension',
              data: { source: value },
              fix(fixer) {
                const quote = node.source.raw[0];
                return fixer.replaceText(
                  node.source,
                  `${quote}${value}.js${quote}`,
                );
              },
            });
          },
        };
      },
    },
  },
};
