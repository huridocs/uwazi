export default {
  delta: 1,
  reindex: false,

  async up() {
    throw new Error('boom from migration');
  },
};
