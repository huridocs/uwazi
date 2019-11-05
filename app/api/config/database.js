const { DBHOST } = process.env;
const { DATABASE_NAME } = process.env;

// Keep in sync with elasticindexes.js!
export default {
  demo: 'mongodb://localhost/uwazi_demo',
  development: `mongodb://${DBHOST || 'localhost'}/${DATABASE_NAME || 'uwazi_development'}`,
  testing: `mongodb://${DBHOST || 'localhost'}/${DATABASE_NAME || 'uwazi_testing'}`,
  production: `mongodb://${DBHOST || 'localhost'}/${DATABASE_NAME || 'uwazi_development'}`
};
