export default {
  delta: 1,
  description: 'migration test 1',

  up() {
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  },
};
