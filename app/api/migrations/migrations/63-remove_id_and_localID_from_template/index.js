/* eslint-disable no-await-in-loop */
export default {
  delta: 63,

  reindex: false,

  name: 'remove_id_and_localID_from_template',

  description: 'Remove deprecated id and localID from template properties',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = await db.collection('templates').find();

    while (await cursor.hasNext()) {
      const template = await cursor.next();
      if (template.properties && template.properties.length > 0) {
        const properties = template.properties.map(property => {
          const sanitizedProperty = { ...property };
          delete sanitizedProperty.id;
          delete sanitizedProperty.localID;
          return sanitizedProperty;
        });
        await db.collection('templates').updateOne({ _id: template._id }, { $set: { properties } });
      }
    }
  },
};
