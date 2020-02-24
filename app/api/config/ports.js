const { PORT } = process.env;
export default {
  production: PORT || 3000,
  development: PORT || 3000,
  demo: PORT || 4000,
};
