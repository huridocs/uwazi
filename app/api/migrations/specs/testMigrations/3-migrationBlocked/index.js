export default {
  delta: 3,
  description: 'migration test 3 blocked',
  requiresSchema: 100,
  reindex: false,

  async up() {
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  },
};
