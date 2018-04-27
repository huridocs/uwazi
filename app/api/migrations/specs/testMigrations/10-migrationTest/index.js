export default {
  version: 10,
  description: 'migration test 10',

  up() {
    return new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  }
};
