export default {
  delta: 23,

  name: 'fix_udaptelogs',

  description: 'delete update logs without mongoId',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.collection('updatelogs').deleteMany({ mongoId: { $exists: false } });
  },
};
