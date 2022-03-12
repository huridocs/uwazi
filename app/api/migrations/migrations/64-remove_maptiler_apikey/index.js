// eslint-disable-next-line import/no-default-export

export default {
  delta: 64,

  name: 'remove maptiler apikey',

  description: 'remove maptiler apikey',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.collection('settings').updateMany({}, { $unset: { mapTilerKey: 1 } });
  },
};
