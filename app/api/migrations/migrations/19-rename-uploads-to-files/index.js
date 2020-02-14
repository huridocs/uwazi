export default {
  delta: 19,

  name: 'rename-uploads-to-files',

  description: 'rename uploads collection to files',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    try {
      await db.collection('uploads').rename('files');
    } catch (e) {
      if (e.message !== 'source namespace does not exist') {
        throw e;
      }
    }

    process.stdout.write('\r\n');
  },
};
