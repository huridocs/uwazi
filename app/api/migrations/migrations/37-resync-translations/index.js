export default {
  delta: 37,

  name: 'resync-tranlsations',

  description: 'Moves timestamp of current translation update logs forward to force resync',

  async up(db) {
    process.stdout.write('Updating updatelogs of translations...\r\n');

    await db
      .collection('updatelogs')
      .updateMany({ namespace: 'translations' }, { $set: { timestamp: Date.now() } });

    process.stdout.write('Updatelogs updated\r\n');
  },
};
