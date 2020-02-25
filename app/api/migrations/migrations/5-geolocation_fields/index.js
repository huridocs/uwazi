/* eslint-disable */

export default {
  delta: 5,

  name: 'geolocation_fields',

  description: 'replicate geolocation fields data for all languages',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const cursor = db.collection('entities').find();
    const processedIds = [];
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      if (entity.metadata) {
        const sharedId = entity.sharedId;
        const entityPropertiesNames = Object.keys(entity.metadata);
        const geolocationProperty = entityPropertiesNames.find(propertyName =>
          propertyName.match('geolocation')
        );
        const propertyValue = entity.metadata[geolocationProperty];

        if (
          !processedIds.includes(sharedId) &&
          geolocationProperty &&
          propertyValue &&
          (propertyValue.lat !== undefined || propertyValue.lon !== undefined)
        ) {
          const changes = {};
          changes[`metadata.${geolocationProperty}`] = propertyValue;
          processedIds.push(sharedId);
          await db.collection('entities').updateMany({ sharedId }, { $set: changes });
        }
      }

      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }
    process.stdout.write('\r\n');
  },
};
