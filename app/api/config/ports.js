const PORT = process.env.PORT;
export default {
  production: PORT ? PORT :  3000,
  development: PORT ? PORT : 3000,
  demo: PORT ? PORT : 4000
};
