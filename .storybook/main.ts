const custom = require('../webpack.config.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
module.exports = {
  stories: [
    '../app/react/stories/**/*.stories.mdx',
    '../app/react/stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],

  staticDirs: ['../cypress/test_files'],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-webpack5-compiler-babel',
    '@chromatic-com/storybook',
    '@storybook/addon-docs'
  ],

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },

  previewHead: head => `
    ${head}
    <style>
      html {
        /* This shold match the application globals */
        font-family: sans-serif;
        font-size: 16px;
      }
    </style>
  `,

  webpackFinal: async config => {
    config.plugins.push(new MiniCssExtractPlugin({}));
    return {
      ...config,
      module: {
        ...config.module,
        rules: custom.module.rules,
      },
    };
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript'
  }
};
