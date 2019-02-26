const { DBHOST } = process.env;
const { DATABASE_NAME } = process.env;
export default {
  demo: 'mongodb://localhost/uwazi_demo',
  development: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_development',
  testing: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_testing',
  production: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_development'
};
