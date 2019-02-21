const { INDEX_NAME } = process.env;

export default {
  production: INDEX_NAME || 'uwazi_development',
  testing: INDEX_NAME || 'testing',
  development: INDEX_NAME || 'uwazi_development',
  demo: INDEX_NAME || 'uwazi_demo'
};
