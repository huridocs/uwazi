/* eslint-disable no-await-in-loop */
export default {
  delta: 14,

  name: 'relationships-to-objects',

  description: 'transforms relationships values from strings to objects and add type to property names',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const templates = await db.collection('templates').find().toArray();
    const cursor = db.collection('entities').find().sort({ _id: 1 });
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      const entityTemplate = entity.template ? entity.template.toString() : '';
      const template = templates.find(t => t._id.toString() === entityTemplate);
      if (template) {
        const originalMetadata = { ...entity.metadata };
        entity.metadata = {};
        template.properties.forEach((property) => {
          if (property.type === 'relationship') {
            const migratedValue = originalMetadata[property.name] ? originalMetadata[property.name].map(value => ({ entity: value })) : [];
            entity.metadata[`${property.name}_${property.type}`] = migratedValue;
            return;
          }
          entity.metadata[`${property.name}_${property.type}`] = originalMetadata[property.name];
        });
        await db.collection('entities').save(entity);
      }
      process.stdout.write(`entities processed -> ${index}\r`);
      index += 1;
    }

    index = 1;
    const templatesCursor = db.collection('templates').find().sort({ _id: 1 });
    while (await templatesCursor.hasNext()) {
      const template = await templatesCursor.next();
      template.properties = template.properties.map((property) => {
        if (property.type !== 'geolocation') {
          property.name = `${property.name}_${property.type}`;
        }
        return property;
      });
      await db.collection('templates').save(template);
      process.stdout.write(`templates processed -> ${index}\r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  }
};
