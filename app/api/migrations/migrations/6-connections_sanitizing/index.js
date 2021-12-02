/* eslint-disable no-await-in-loop */
export default {
  delta: 6,

  name: 'connections_sanitizing',

  description: 'Sanitize connections across multiple languages',

  async up(db) {
    process.stdout.write('Sanitizing connections...\r\n');

    const settingsCursor = db.collection('settings').find();
    const settings = await settingsCursor.next();
    const { languages } = settings;

    process.stdout.write('Deleting incomplete connections...\r\n');

    let firstIndex = 1;
    let incomplete = 0;

    const firstCursor = db.collection('connections').find();
    while (await firstCursor.hasNext()) {
      const connection = await firstCursor.next();
      const sharedConnections = await db
        .collection('connections')
        .countDocuments({ sharedId: connection.sharedId });

      if (!(connection.range && connection.range.text) && sharedConnections < languages.length) {
        incomplete += 1;
        await db.collection('connections').deleteMany({ sharedId: connection.sharedId });
      }

      process.stdout.write(`processed -> ${firstIndex}, deleted -> ${incomplete}\r`);
      firstIndex += 1;
    }

    process.stdout.write('\r\n');
    process.stdout.write('Deleting orphaned hubs...\r\n');

    let secondIndex = 1;
    let orphaned = 0;

    const secondCursor = db.collection('connections').aggregate([{ $group: { _id: '$hub' } }]);
    while (await secondCursor.hasNext()) {
      const hub = await secondCursor.next();

      const hubConnections = await db.collection('connections').find({ hub: hub._id }).toArray();

      const shouldDeleteHub = languages.reduce(
        (shouldDelete, currentLanguage) =>
          hubConnections.filter(c => c.language === currentLanguage.key).length < 2 && shouldDelete,
        true
      );

      if (shouldDeleteHub) {
        orphaned += 1;
        await db.collection('connections').deleteMany({ hub: hub._id });
      }

      process.stdout.write(`processed -> ${secondIndex}, deleted -> ${orphaned}\r`);
      secondIndex += 1;
    }

    process.stdout.write('\r\n');
  },
};
