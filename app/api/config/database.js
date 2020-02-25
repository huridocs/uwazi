export const { DBHOST = 'localhost' } = process.env;
export const { DATABASE_NAME } = process.env;

// Keep in sync with elasticindexes.js!
export default {
  demo: 'mongodb://localhost/uwazi_demo',
  development: `mongodb://${DBHOST}/${DATABASE_NAME || 'uwazi_development'}`,
  testing: `mongodb://${DBHOST}/${DATABASE_NAME || 'uwazi_testing'}`,
  production: `mongodb://${DBHOST}/${DATABASE_NAME || 'uwazi_development'}`,
};
