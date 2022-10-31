export default {
  delta: 24,

  name: 'fix_udaptelogs_again',

  description: 'delete update logs without mongoId',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.collection('updatelogs').deleteMany({ mongoId: { $exists: false } });
  },
};
