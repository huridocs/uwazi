export default {
  delta: 10,
  description: 'migration test 10',
  reindex: false,

  up() {
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  },
};
