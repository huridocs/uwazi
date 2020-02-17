export default {
  delta: 2,
  description: 'migration test 2',

  up() {
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  },
};
