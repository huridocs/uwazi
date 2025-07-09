export default {
  delta: 173,

  name: 'reindex',

  description:
    'Force reindex, a bug prevented reindexing in some scenarios during templates update',

  reindex: true,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
