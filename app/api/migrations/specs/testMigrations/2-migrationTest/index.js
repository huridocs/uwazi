export default {
  delta: 2,
  description: 'migration test 2',
  reindex: false,

  up() {
    this.reindex = true;
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  },
};
