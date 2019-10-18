"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;const { DBHOST } = process.env;
const { DATABASE_NAME } = process.env;var _default =
{
  demo: 'mongodb://localhost/uwazi_demo',
  development: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_development',
  testing: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_testing',
  production: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_development' };exports.default = _default;