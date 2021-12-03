export default {
  delta: 27,

  name: 'settings-date-format',

  description:
    'Changes the configured date format in settings to be compatible with Date.js instad of moment.js',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const [settings] = await db.collection('settings').find().toArray();

    let { dateFormat } = settings;
    if (dateFormat) {
      dateFormat = dateFormat.replace('YYYY', 'yyyy');
      dateFormat = dateFormat.replace('DD', 'dd');

      return db.collection('settings').updateOne({ _id: settings._id }, { $set: { dateFormat } });
    }
    return false;
  },
};
