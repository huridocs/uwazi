/* eslint-disable */
'use strict';
import path, { join } from 'path';
import configFunction from './webpack/config.mjs';
import { fileURLToPath } from 'url';

var config = configFunction();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config.context = __dirname;

export default config;
