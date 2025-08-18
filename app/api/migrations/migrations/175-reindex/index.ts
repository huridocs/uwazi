export default {
  delta: 175,

  name: 'reindex',

  description: 'Force reindex, template update full Reindex was ignoring fullText',

  reindex: true,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
