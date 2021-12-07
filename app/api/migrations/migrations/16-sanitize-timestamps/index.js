/* eslint-disable no-await-in-loop */

const sanitizeDate = (property, value) => {
  if (property.type === 'date' && value) {
    return parseInt(value, 10);
  }

  if (property.type === 'multidate' && value) {
    return value.filter(v => v).map(v => parseInt(v, 10));
  }

  if (property.type === 'daterange' && value) {
    return {
      from: value.from ? parseInt(value.from, 10) : null,
      to: value.to ? parseInt(value.to, 10) : null,
    };
  }

  if (property.type === 'multidaterange' && value) {
    return value.map(v => ({
      from: v.from ? parseInt(v.from, 10) : null,
      to: v.to ? parseInt(v.to, 10) : null,
    }));
  }
};

export default {
  delta: 16,

  name: 'sanitize-timestamps',

  description: 'change string timestamps to int',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const templates = await db.collection('templates').find().toArray();

    const templatesByKey = templates.reduce((memo, t) => ({ ...memo, [t._id.toString()]: t }), {});

    const cursor = db.collection('entities').find();

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      if (entity.metadata) {
        const newMetadata = Object.keys(entity.metadata).reduce((metadata, propertyName) => {
          const property = templatesByKey[entity.template.toString()].properties.find(
            p => p.name === propertyName
          );

          if (
            property &&
            ['date', 'daterange', 'multidate', 'multidaterange'].includes(property.type)
          ) {
            return {
              ...metadata,
              [propertyName]: sanitizeDate(property, entity.metadata[propertyName]),
            };
          }

          return {
            ...metadata,
            [propertyName]: entity.metadata[propertyName],
          };
        }, {});

        await db
          .collection('entities')
          .updateOne({ _id: entity._id }, { $set: { metadata: newMetadata } });
      }
    }

    process.stdout.write('\r\n');
  },
};
