/* eslint-disable */
import configFactory from './webpack/config.cjs';

const config = configFactory();

config.context = import.meta.url.replace('file://', '').replace('/webpack.config.js', '');

export default config;
