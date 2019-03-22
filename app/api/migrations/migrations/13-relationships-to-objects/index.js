/* eslint-disable no-await-in-loop */
export default {
  delta: 13,

  name: 'relationships-to-objects',

  description: 'transforms relationships values from strings to objects',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const templates = await db.collection('templates').find().toArray();
    const cursor = db.collection('entities').find();
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      const template = templates.find(t => t._id.toString() === entity.template);
      if (template) {
        template.properties.forEach((property) => {
          if (property.type === 'relationship' && entity.metadata[property.name]) {
            entity.metadata[property.name] = entity.metadata[property.name].map(value => ({ entity: value }));
          }
        });
        await db.collection('entities').save(entity);
      }
      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  }
};
