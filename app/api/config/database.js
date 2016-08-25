const COUCHDBURL = process.env.COUCHDB_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;
export default {
  demo: 'http://127.0.0.1:5984/uwazi_demo',
  development: COUCHDBURL ? `${COUCHDBURL}/${DATABASE_NAME}` : 'http://127.0.0.1:5984/uwazi_development',
  testing: COUCHDBURL ? `${COUCHDBURL}/${DATABASE_NAME}` : 'http://127.0.0.1:5984/uwazi_testing',
  production: `http://127.0.0.1:5984/${DATABASE_NAME}`
};
