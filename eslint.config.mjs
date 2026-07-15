import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import react from 'eslint-plugin-react';
import jest from 'eslint-plugin-jest';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import node from 'eslint-plugin-node';
import reactHooks from 'eslint-plugin-react-hooks';
import cypress from 'eslint-plugin-cypress';

import tsParser from '@typescript-eslint/parser';
import { FlatCompat } from '@eslint/eslintrc';
import rules from './uwazi-eslint-rules.cjs';
import storybook from 'eslint-plugin-storybook';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const localRulesPlugin = {
  rules: {
    'require-js-extension': {
      meta: {
        type: 'problem',
        fixable: 'code',
        schema: [],
        messages: {
          missingJsExtension: "Relative import '{{source}}' is missing the .js extension.",
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
                return fixer.replaceText(node.source, `${quote}${value}.js${quote}`);
              },
            });
          },
        };
      },
    },
  },
};

export default defineConfig([
  { ignores: ['**/__snapshots__/**', '**/*.snap', 'eslint.config.mjs'] },
  ...compat.extends('airbnb'),
  cypress.configs.recommended,
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.jasmine,
        ...cypress.configs.globals.languageOptions.globals,
      },
      ecmaVersion: 2022,
    },
    plugins: {
      react,
      jest,
      '@typescript-eslint': typescriptEslint,
      prettier,
      node,
      'react-hooks': reactHooks,
      cypress,
    },

    rules: {
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],

      'prettier/prettier': [
        'error',
        {
          requirePragma: false,
        },
      ],

      'node/no-restricted-import': [
        'error',
        [
          {
            name: 'fs',
            message: 'Please use { storage } from api/files',
          },
          {
            name: 'fs/promises',
            message: 'Please use { storage } from api/files',
          },
        ],
      ],

      indent: 'off',
      'generator-star-spacing': 'off',
      'brace-style': 'off',
      'operator-linebreak': 'off',
      'space-before-function-paren': 'off',
      'no-mixed-operators': 'off',
      'no-underscore-dangle': 'off',
      'comma-dangle': 'off',
      'spaced-comment': 'off',
      'object-curly-newline': 'off',
      'function-paren-newline': 'off',
      'react/prefer-stateless-function': 'off',
      'no-confusing-arrow': 'off',
      'newline-per-chained-call': 'off',
      'no-prototype-builtins': 'off',
      'implicit-arrow-linebreak': 'off',
      'jest/no-focused-tests': 'error',
      'object-curly-spacing': ['warn', 'always'],

      'max-len': [
        'error',
        150,
        {
          ignoreStrings: true,
        },
      ],

      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          argsIgnorePattern: '^_',
          args: 'all',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],

      'prefer-promise-reject-errors': ['warn'],
      'max-classes-per-file': ['warn'],
      'padded-blocks': ['warn'],
      'consistent-return': ['warn'],
      'prefer-const': ['warn'],
      'arrow-body-style': ['warn'],
      'arrow-parens': ['off'],
      'prefer-template': ['warn'],
      'no-tabs': ['warn'],
      'object-shorthand': ['warn'],
      'prefer-destructuring': ['warn'],
      'class-methods-use-this': ['warn'],
      'no-return-assign': ['warn'],
      'no-param-reassign': ['warn'],
      'array-callback-return': ['warn'],
      'prefer-arrow-callback': ['warn'],
      'jsx-quotes': ['warn'],
      'object-property-newline': ['warn'],
      'prefer-rest-params': ['warn'],
      'import/no-mutable-exports': ['warn'],
      'global-require': ['warn'],
      'react/no-string-refs': ['warn'],
      'no-unneeded-ternary': ['warn'],
      'no-useless-escape': ['warn'],
      'arrow-spacing': ['warn'],
      'no-empty': ['warn'],
      'no-cond-assign': ['warn'],
      'no-multiple-empty-lines': ['warn'],
      'lines-between-class-members': ['warn'],
      'max-lines': ['warn', 250],
      'max-params': ['warn', 4],
      'max-lines-per-function': 'off',

      'max-statements': ['warn', 10, { ignoreTopLevelFunctions: true }],

      'no-restricted-exports': ['warn'],
      'import/no-duplicates': ['warn'],
      'import/no-default-export': ['warn'],
      'import/exports-last': ['warn'],
      'import/no-named-as-default': ['warn'],
      'import/prefer-default-export': ['off'],
      'import/first': ['warn'],
      'import/newline-after-import': ['warn'],
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'import/order': ['warn'],
      'import/named': ['warn'],
      'import/no-cycle': ['warn'],

      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
        },
      ],

      'import/no-import-module-exports': ['warn'],
      'react/static-property-placement': 'off',
      'react/no-deprecated': ['warn'],
      'react/self-closing-comp': ['warn'],
      'react/no-multi-comp': ['warn'],
      'react/jsx-closing-bracket-location': ['warn'],

      'react/jsx-boolean-value': [
        'warn',
        'never',
        {
          always: [
            'date-rangepicker',
            'datepicker',
            'inline-datepicker',
            'datepicker-autohide',
            'datepicker-buttons',
            'datepicker-autoselect-today',
          ],
        },
      ],

      'react/jsx-indent': ['off'],
      'react/jsx-indent-props': ['warn'],
      'react/no-array-index-key': ['warn'],
      'react/jsx-props-no-spreading': ['warn'],
      'react/jsx-first-prop-new-line': ['warn'],
      'react/no-unused-state': ['warn'],
      'react/jsx-wrap-multilines': ['off'],
      'react/jsx-curly-brace-presence': ['warn'],
      'react/jsx-curly-newline': 'off',

      'react/require-default-props': [
        'warn',
        {
          forbidDefaultForRequired: false,
          ignoreFunctionalComponents: true,
        },
      ],

      'react/forbid-prop-types': ['warn'],
      'react/jsx-no-bind': ['warn'],
      'react/sort-comp': ['warn'],
      'react/jsx-closing-tag-location': ['warn'],
      'react/jsx-max-props-per-line': ['warn'],
      'react/no-unescaped-entities': ['warn'],
      'react/no-unused-prop-types': ['warn'],
      'react/jsx-no-target-blank': ['warn'],
      'react/jsx-filename-extension': 'off',
      'react/jsx-tag-spacing': 'off',
      'react/destructuring-assignment': ['off'],
      'react/jsx-one-expression-per-line': 'off',
      'import/no-useless-path-segments': ['warn'],
      'react/button-has-type': ['warn'],
      'react/no-access-state-in-setstate': ['warn'],
      'react/jsx-pascal-case': ['warn'],

      'react/default-props-match-prop-types': [
        'error',
        {
          allowRequiredDefaults: true,
        },
      ],

      'react/function-component-definition': [
        2,
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],

      'react/jsx-no-useless-fragment': [
        2,
        {
          allowExpressions: true,
        },
      ],

      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            'no-translate',
            'date-rangepicker',
            'datepicker',
            'inline-datepicker',
            'datepicker-autohide',
            'datepicker-buttons',
            'datepicker-autoselect-today',
          ],
        },
      ],

      'jsx-a11y/anchor-is-valid': ['warn'],
      'jsx-a11y/label-has-for': ['off'],
      'jsx-a11y/html-has-lang': ['warn'],
      'jsx-a11y/iframe-has-title': ['warn'],
      'jsx-a11y/tabindex-no-positive': ['warn'],
      'jsx-a11y/no-noninteractive-element-interactions': ['warn'],
      'jsx-a11y/control-has-associated-label': ['warn'],
      'jsx-a11y/alt-text': ['warn'],
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/mouse-events-have-key-events': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': ['warn'],

      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name='scrollIntoView']",
          message:
            "'scrollIntoView()' will scroll all scrollable elements if 'container' option is not available. Consider using '#V2/helpers/scrollIntoView.ts' to avoid potencial issues",
        },
        {
          selector:
            "OptionalCallExpression[callee.type='MemberExpression'][callee.property.name='scrollIntoView']",
          message:
            "'scrollIntoView()' will scroll all scrollable elements if 'container' option is not available. Consider using '#V2/helpers/scrollIntoView.ts' to avoid potencial issues",
        },
      ],
    },
  },
  {
    files: ['app/api/**/*.ts'],
    plugins: { local: localRulesPlugin },

    rules: {
      'local/require-js-extension': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'LabeledStatement',
          message:
            'Labels are a form of GOTO; using them makes code confusing and hard to maintain.',
        },
        {
          selector: 'WithStatement',
          message:
            '`with` is disallowed in strict mode because it makes code unpredictable and unoptimizable.',
        },
      ],
    },
  },
  {
    files: ['app/**/*spec.js'],

    rules: {
      'max-lines-per-function': 'off',
    },
  },
  {
    files: ['app/**/specs/*'],

    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'global-require': 'off',
      'import/no-dynamic-require': 'off',
    },
  },
  {
    files: ['**/*.stories.{js,jsx,ts,tsx}', 'app/react/stories/**/*.{js,jsx,ts,tsx}'],

    rules: {
      'import/no-default-export': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/no-multi-comp': 'off',
    },
  },
  {
    files: ['app/**/*.ts*', 'database/**/*.ts', 'e2e/**/*.ts'],
    ignores: ['**/*.cy.tsx'],
    plugins: { '@typescript-eslint': typescriptEslint },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' },
    },
    rules: {
      ...rules,

      'no-empty-function': [
        'warn',
        {
          allow: ['constructors'],
        },
      ],

      'no-useless-constructor': 'off',
    },
  },
  {
    files: ['app/react/**/*.tsx'],
    plugins: { '@typescript-eslint': typescriptEslint },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' },
    },
    rules: {
      ...rules,

      'max-statements': ['warn', 20],
    },
  },
  {
    files: ['./cypress/**/*.ts', './cypress/**/*.d.ts', './**/*.cy.tsx'],
    plugins: { '@typescript-eslint': typescriptEslint },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './cypress/tsconfig.json' },
    },
    rules: {
      ...rules,
    },
  },
]);
