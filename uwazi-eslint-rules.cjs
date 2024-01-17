module.exports = {
  quotes: 'off',
  '@typescript-eslint/quotes': [
    'error',
    'single',
    {
      avoidEscape: true,
    },
  ],
  'no-shadow': 'off',
  '@typescript-eslint/no-shadow': ['error'],
  'no-use-before-define': 'off',
  '@typescript-eslint/no-use-before-define': ['error'],
  'no-unused-vars': 'off',

  //https://github.com/typescript-eslint/typescript-eslint/issues/662
  'no-undef': 'off',

  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      vars: 'all',
      argsIgnorePattern: '^_',
      args: 'all',
      caughtErrors: 'none',
      ignoreRestSiblings: true,
    },
  ],
  '@typescript-eslint/no-explicit-any': [
    'off',
    {
      fixToUnknown: false,
      ignoreRestArgs: false,
    },
  ],
  '@typescript-eslint/explicit-function-return-type': [
    'off',
    {
      allowExpressions: true,
    },
  ],
  // This is broken for ts, but circleci protects us.
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      checksVoidReturn: false,
    },
  ],
  '@typescript-eslint/promise-function-async': 'error',

  'no-dupe-class-members': 'off',
  '@typescript-eslint/no-dupe-class-members': ['error'],
};
