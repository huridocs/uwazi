import type { StorybookConfig } from '@storybook/react-webpack5';
import type { Configuration, WebpackPluginInstance } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import uwaziWebpackConfig from '../webpack/config.cjs';

const uwaziConfig = uwaziWebpackConfig();

const STORYBOOK_INCOMPATIBLE_PLUGINS = new Set([
  'CleanWebpackPlugin',
  'AssetsPlugin',
  'BundleAnalyzerPlugin',
  'CopyWebpackPlugin',
  'RtlCssPlugin',
  'HotModuleReplacementPlugin',
  'MiniCssExtractPlugin',
  'MonacoWebpackPlugin',
  'NodePolyfillPlugin',
]);

const config: StorybookConfig = {
  framework: '@storybook/react-webpack5',
  stories: ['../app/react/stories/**/*.stories.tsx'],
  staticDirs: ['../cypress/test_files'],
  webpackFinal: async (storybookConfig: Configuration): Promise<Configuration> => {
    const uwaziPlugins = ((uwaziConfig.plugins ?? []) as WebpackPluginInstance[]).filter(
      plugin => plugin && !STORYBOOK_INCOMPATIBLE_PLUGINS.has(plugin.constructor?.name ?? '')
    );

    return {
      ...storybookConfig,
      resolve: {
        ...storybookConfig.resolve,
        ...uwaziConfig.resolve,
        extensions: [
          ...new Set([
            ...(storybookConfig.resolve?.extensions ?? []),
            ...(uwaziConfig.resolve?.extensions ?? []),
          ]),
        ],
      },
      module: {
        ...storybookConfig.module,
        rules: [
          ...(uwaziConfig.module?.rules ?? []),
          ...(storybookConfig.module?.rules ?? []).filter(
            rule =>
              rule &&
              typeof rule === 'object' &&
              'test' in rule &&
              !(rule.test instanceof RegExp && rule.test.source.includes('\\.css'))
          ),
        ],
      },
      plugins: [
        ...(storybookConfig.plugins ?? []),
        ...uwaziPlugins,
        new MiniCssExtractPlugin({}),
        new MonacoWebpackPlugin({ languages: ['typescript', 'html', 'css'] }),
        new NodePolyfillPlugin({ onlyAliases: ['path', 'url', 'util', 'Buffer'] }),
      ],
    };
  },
};

export default config;
