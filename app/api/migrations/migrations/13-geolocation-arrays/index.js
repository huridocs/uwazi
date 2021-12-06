/* eslint-disable no-await-in-loop */
export default {
  delta: 13,

  name: 'geolocation-arrays',

  description: 'Change the current single-entry geolocation to arrays',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const templates = await db.collection('templates').find().toArray();

    const templatesByKey = templates.reduce((memo, t) => ({ ...memo, [t._id.toString()]: t }), {});

    const templatesWithGeolocation = templates
      .filter(t => {
        let hasGeolocation = false;
        t.properties.forEach(p => {
          if (p.type === 'geolocation') {
            hasGeolocation = true;
          }
        });

        return hasGeolocation;
      })
      .map(t => t._id);

    let index = 1;
    const cursor = db.collection('entities').find({ template: { $in: templatesWithGeolocation } });

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      if (entity.metadata) {
        const newMetadata = Object.keys(entity.metadata).reduce((metadata, property) => {
          const propertyData = templatesByKey[entity.template.toString()].properties.find(
            p => p.name === property
          );
          if (
            propertyData &&
            propertyData.type === 'geolocation' &&
            !Array.isArray(entity.metadata[property])
          ) {
            return { ...metadata, [property]: [entity.metadata[property]] };
          }
          return { ...metadata, [property]: entity.metadata[property] };
        }, {});

        await db
          .collection('entities')
          .updateOne({ _id: entity._id }, { $set: { metadata: newMetadata } });
      }

      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  },
};
