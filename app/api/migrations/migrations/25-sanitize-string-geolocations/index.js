/* eslint-disable no-await-in-loop */

import logger from 'api/migrations/logger';

const migrationName = 'sanitize-string-geolocations';

function sanitizeGeolocation(property) {
  if (!Array.isArray(property) || !property.length) {
    return property;
  }

  const value = { ...property[0].value };

  const lat = Number(value.lat).valueOf();
  const lon = Number(value.lon).valueOf();

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new Error('Value is NaN');
  }

  return [
    {
      value: { ...value, lat, lon },
    },
  ];
}

function sanitizeMetadataCallback(entity, templates) {
  // eslint-disable-next-line max-statements
  return (memo, propertyName) => {
    const property = templates[entity.template.toString()].properties.find(
      p => p.name === propertyName
    );

    if (property && property.type === 'geolocation') {
      let sanitized = entity.metadata[propertyName];

      try {
        sanitized = sanitizeGeolocation(entity.metadata[propertyName]);
      } catch (e) {
        if (e.message === 'Value is NaN') {
          sanitized = [];
          logger.logFieldParseError(
            {
              template: entity.template,
              sharedId: entity.sharedId,
              title: entity.title,
              propertyName,
              value: entity.metadata[propertyName],
            },
            migrationName
          );
        }
      }

      return { ...memo, [propertyName]: sanitized };
    }

    return { ...memo, [propertyName]: entity.metadata[propertyName] };
  };
}

export default {
  delta: 25,

  name: migrationName,

  description: 'change string geolocations to int',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const templates = await db.collection('templates').find().toArray();
    const templatesByKey = templates.reduce((memo, t) => ({ ...memo, [t._id.toString()]: t }), {});

    const cursor = db.collection('entities').find();

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      if (entity.metadata) {
        const newMetadata = Object.keys(entity.metadata).reduce(
          sanitizeMetadataCallback(entity, templatesByKey),
          {}
        );

        await db
          .collection('entities')
          .updateOne({ _id: entity._id }, { $set: { metadata: newMetadata } });
      }
    }

    process.stdout.write('\r\n');
  },
};
