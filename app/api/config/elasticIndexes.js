const { DATABASE_NAME, INDEX_NAME } = process.env;

// Keep in sync with database.js!
export default {
  demo: INDEX_NAME || DATABASE_NAME || 'uwazi_demo',
  development: INDEX_NAME || DATABASE_NAME || 'uwazi_development',
  testing: INDEX_NAME || DATABASE_NAME || 'testing',
  production: INDEX_NAME || DATABASE_NAME || 'uwazi_development',
  index: '',
};
