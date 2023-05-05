const rules = require('./uwazi-eslint-rules');
module.exports = {
  extends: ['airbnb', 'plugin:cypress/recommended', 'plugin:storybook/recommended'],
  env: {
    browser: true,
    node: true,
    jest: true,
    jasmine: true,
    es6: true,
    'cypress/globals': true
  },
  parserOptions: {
    ecmaVersion: 2020
  },
  plugins: ['react', 'jest', '@typescript-eslint', 'prettier', 'node', 'react-hooks', 'eslint-plugin-cypress'],
  rules: {
    'prettier/prettier': ['error', {
      requirePragma: false
    }],
    'node/no-restricted-import': ['error', [{
      name: 'fs',
      message: 'Please use { storage } from api/files'
    }, {
      name: 'fs/promises',
      message: 'Please use { storage } from api/files'
    }]],
    indent: 'off',
    // handled by prettier
    'operator-linebreak': 'off',
    // handled by prettier
    'space-before-function-paren': 'off',
    // handled by prettier
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
    'max-len': ['error', 150, {
      ignoreStrings: true
    }],
    'no-unused-vars': ['error', {
      vars: 'all',
      argsIgnorePattern: '^_',
      args: 'all',
      caughtErrors: 'none',
      ignoreRestSiblings: true
    }],
    //all warns are activated by default if removed
    'prefer-promise-reject-errors': ['warn'],
    'max-classes-per-file': ['warn'],
    'padded-blocks': ['warn'],
    'consistent-return': ['warn'],
    'prefer-const': ['warn'],
    'arrow-body-style': ['warn'],
    'arrow-parens': ['off'],
    // handled by prettier
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
    'max-statements': ['warn', {
      max: 10
    }, {
      ignoreTopLevelFunctions: true
    }],
    'no-restricted-exports': ['warn'],
    //import
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
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true
    }],
    'import/no-import-module-exports': ['warn'],
    //react
    'react/static-property-placement': 'off',
    'react/no-deprecated': ['warn'],
    'react/self-closing-comp': ['warn'],
    'react/no-multi-comp': ['warn'],
    'react/jsx-closing-bracket-location': ['warn'],
    'react/jsx-boolean-value': ['warn'],
    'react/jsx-indent': ['off'],
    // handled by prettier,
    'react/jsx-indent-props': ['warn'],
    'react/no-array-index-key': ['warn'],
    'react/jsx-props-no-spreading': ['warn'],
    'react/jsx-first-prop-new-line': ['warn'],
    'react/no-unused-state': ['warn'],
    'react/jsx-wrap-multilines': ['off'],
    // handled by prettier,
    'react/jsx-curly-brace-presence': ['warn'],
    'react/jsx-curly-newline': 'off',
    'react/require-default-props': ['warn', {
      forbidDefaultForRequired: false,
      ignoreFunctionalComponents: true
    }],
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
    'react/default-props-match-prop-types': ['error', {
      allowRequiredDefaults: true
    }],
    'react/function-component-definition': [2, {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function'
    }],
    'react/jsx-no-useless-fragment': [2, {
      allowExpressions: true
    }],
    'react/no-unknown-property': ['error', {
      ignore: ['no-translate']
    }],
    //jsx-a11y
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
    //react-hooks && recoil
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': ['warn', {
      additionalHooks: '(useRecoilCallback|useRecoilTransaction_UNSTABLE)'
    }]
  },
  overrides: [{
    files: ['app/**/*spec.js'],
    rules: {
      'max-lines-per-function': 'off'
    }
  }, {
    files: ['app/**/specs/*'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off'
    }
    {
      files: ['app/react/stories/*.stories.tsx'],
      rules: {
        'react/no-multi-comp': 'off',
      },
    },
  }, {
    files: ['app/**/*.ts*', 'database/**/*.ts', 'e2e/**/*.ts'],
    excludedFiles: './**/*.cy.tsx',
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json'
    },
    rules: {
      ...rules
    }
  }, {
    files: ['./cypress/**/*.ts', './cypress/**/*.d.ts', './**/*.cy.tsx'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './cypress/tsconfig.json'
    },
    rules: {
      ...rules
    }
  }]
};