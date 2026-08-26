export default {
  delta: 1,
  description: 'migration test 1',

  async up() {
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  },
};
