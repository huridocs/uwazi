export default {
  delta: 19,

  name: 'rename-uploads-to-files',

  description: 'rename uploads collection to files',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.collection('uploads').rename('files');
  },
};
