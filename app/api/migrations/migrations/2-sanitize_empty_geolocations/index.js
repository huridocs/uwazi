export default {
  delta: 2,

  name: 'sanitize_empty_geolocations',

  description: 'Delete empty geolocation properties',

  up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    return new Promise((resolve, reject) => {
      const cursor = db.collection('entities').find();
      let index = 1;
      cursor.on('data', (entity) => {
        cursor.pause();
        if (!entity.metadata) {
          process.stdout.write(`processed -> ${index}\r`);
          index += 1;
          cursor.resume();
          return;
        }

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
        db.collection('entities').findOneAndUpdate(entity, { $set: { metadata } }, () => {
          process.stdout.write(`processed -> ${index}\r`);
          index += 1;
          cursor.resume();
        });
      });

      cursor.on('err', reject);
      cursor.on('end', () => {
        process.stdout.write(`processed -> ${index}\r\n`);
        resolve();
      });
    });
  }
};
