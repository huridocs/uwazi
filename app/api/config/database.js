const DBHOST = process.env.DBHOST;
const DATABASE_NAME = process.env.DATABASE_NAME;
export default {
  demo: 'mongodb://localhost/uwazi_demo',
  development: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_development',
  testing: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_testing',
  production: DBHOST ? `mongodb://${DBHOST}/${DATABASE_NAME}` : 'mongodb://localhost/uwazi_development'
};
