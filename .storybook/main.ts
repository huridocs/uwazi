import type { StorybookConfig } from '@storybook/react-webpack5';
import type { Configuration, WebpackPluginInstance } from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import uwaziWebpackConfig from '../webpack/config.cjs';

const uwaziConfig = uwaziWebpackConfig();

const STORYBOOK_INCOMPATIBLE_PLUGINS = new Set([
  'CleanWebpackPlugin',
  'HotModuleReplacementPlugin',
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
          ...(storybookConfig.resolve?.extensions ?? []),
          ...(uwaziConfig.resolve?.extensions ?? []),
        ],
      },
      module: {
        ...storybookConfig.module,
        rules: [
          //Filter storybook's css rules and use UWAZI's
          ...(storybookConfig.module?.rules ?? []).filter(
            rule =>
              rule &&
              typeof rule === 'object' &&
              'test' in rule &&
              !(rule.test instanceof RegExp && rule.test.source.includes('\\.css'))
          ),
          ...(uwaziConfig.module?.rules ?? []),
        ],
      },
      plugins: [...(storybookConfig.plugins ?? []), ...uwaziPlugins],
    };
  },
};

export default config;
