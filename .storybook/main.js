const custom = require('../webpack.config.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  stories: [
    '../app/react/stories/**/*.stories.mdx',
    '../app/react/stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  previewHead: head => `
    ${head}
    <style>
      html {
        /* This shold match the application globals */
        font-family: sans;
        font-size: 16px;
      }
    </style>
  `,
  webpackFinal: async config => {
    config.plugins.push(new MiniCssExtractPlugin({}));
    return { ...config, module: { ...config.module, rules: custom.module.rules } };
  },
};
