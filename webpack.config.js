/* eslint-disable */
import configFactory from './webpack/config.cjs';

export default (env) => {
  const isProduction = env?.production || process.env.NODE_ENV === 'production';
  const config = configFactory(isProduction);
  config.context = import.meta.url.replace('file://', '').replace('/webpack.config.js', '');
  return config;
};
