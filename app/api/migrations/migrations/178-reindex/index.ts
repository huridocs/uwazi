export default {
  delta: 178,

  name: 'reindex',

  description: 'Force reindex, markdown change of elastic mappgins to make it compatible with text',

  reindex: true,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
