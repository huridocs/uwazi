/* eslint-disable no-await-in-loop */
export default {
  delta: 28,

  name: 'remove_not_allowed_metadata_properties',

  description:
    'remove metadata properties from entities that is no longer on the template they belong',

  async up(db) {
    const cursor = db.collection('entities').find({});
    let index = 1;
    const templatesProperties = {};

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      if (!templatesProperties[entity.template.toString()]) {
        templatesProperties[entity.template.toString()] = (
          await db.collection('templates').findOne({ _id: entity.template })
        ).properties.map(p => p.name);
      }

      const propertiesOnTemplate = templatesProperties[entity.template.toString()];
      const metadata = propertiesOnTemplate.reduce((newMetadata, prop) => {
        if (entity.metadata[prop]) {
          //eslint-disable-next-line no-param-reassign
          newMetadata[prop] = entity.metadata[prop];
        }
        return newMetadata;
      }, {});

      await db.collection('entities').updateOne({ _id: entity._id }, { $set: { metadata } });

      process.stdout.write(`-> processed: ${index} \r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  },
};
