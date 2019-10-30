/* eslint-disable no-await-in-loop */
export default {
  delta: 2,

  name: 'sanitize_empty_geolocations',

  description: 'Delete empty geolocation properties',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;

    const cursor = db.collection('entities').find();
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      if (entity.metadata) {
        const metadataProperties = Object.keys(entity.metadata);
        const metadata = metadataProperties.reduce((_metadata, k) => {
          const isGeolocation = k.indexOf('_geolocation') > -1;
          const value = entity.metadata[k];
          const noLat = value && !value.lat;
          const noLon = value && !value.lon;
          if (isGeolocation && noLat && noLon) {
            return _metadata;
          }
          _metadata[k] = entity.metadata[k];
          return _metadata;
        }, {});
        await db.collection('entities').findOneAndUpdate(entity, { $set: { metadata } });
      }
      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }
    process.stdout.write('\r\n');
  },
};
