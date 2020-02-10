export default {
  delta: 10,

  name: 'sync-starting-point',

  description: 'Create a sync starting point so that everything required is already in the logs',

  async up(db) {
    process.stdout.write('Sync - Creating update logs: \r\n');

    process.stdout.write('Emptying current logs... \r\n');
    await db.collection('updatelogs').deleteMany({});

    const collectionsToInclude = [
      'settings',
      'templates',
      'entities',
      'connections',
      'dictionaries',
      'translations',
      'relationtypes',
    ];
    const requiredOrder = {
      settings: 1,
      dictionaries: 2,
      relationtypes: 2,
      translations: 2,
      templates: 3,
      entities: 4,
      connections: 5,
    };

    const updateLogValues = await collectionsToInclude.reduce(async (prev, namespace) => {
      const values = await prev;
      const ids = await db.collection(namespace).distinct('_id', {});
      process.stdout.write(`Processing ${ids.length} ${namespace} \r\n`);
      return values.concat(
        ids.map(mongoId => ({
          mongoId,
          timestamp: requiredOrder[namespace],
          namespace,
          deleted: false,
        }))
      );
    }, Promise.resolve([]));

    process.stdout.write(`Inserting ${updateLogValues.length} update logs...\r\n`);
    await db.collection('updatelogs').insertMany(updateLogValues);

    process.stdout.write('Done! \r\n');
  },
};
