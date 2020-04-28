/* eslint-disable no-await-in-loop */

function sanitizeGeolocation(property) {
  if (!Array.isArray(property) || !property.length) return property;

  const value = { ...property[0].value };

  // eslint-disable-next-line no-new-wrappers
  const lat = new Number(value.lat).valueOf();
  // eslint-disable-next-line no-new-wrappers
  const lon = new Number(value.lon).valueOf();

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    //Log into activity log
    return [{ value: { ...value, lat: 0, lon: 0 } }];
  }

  return [
    {
      value: {
        ...value,
        lat,
        lon,
      },
    },
  ];
}

function sanitizeMetadataCallback(entity, templates) {
  return (memo, propertyName) => {
    const property = templates[entity.template.toString()].properties.find(
      p => p.name === propertyName
    );

    if (property && property.type === 'geolocation') {
      return Object.assign({}, memo, {
        [propertyName]: sanitizeGeolocation(entity.metadata[propertyName]),
      });
    }

    return Object.assign({}, memo, { [propertyName]: entity.metadata[propertyName] });
  };
}

export default {
  delta: 25,

  name: 'sanitize-string-geolocations',

  description: 'change string geolocations to int',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const templates = await db
      .collection('templates')
      .find()
      .toArray();
    const templatesByKey = templates.reduce(
      (memo, t) => Object.assign({}, memo, { [t._id.toString()]: t }),
      {}
    );

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
          .update({ _id: entity._id }, { $set: { metadata: newMetadata } });
      }
    }

    process.stdout.write('\r\n');
  },
};
