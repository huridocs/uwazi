/* eslint-disable no-await-in-loop */

export default {
  delta: 48,

  name: 'fix_migration_45_inherit_property',

  description:
    'migration 45 sets inherit.property to the original objectId, this should be a string',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = await db.collection('templates').find({ properties: { $exists: true } });

    while (await cursor.hasNext()) {
      const template = await cursor.next();
      const properties = await Promise.all(
        template.properties.map(async prop => {
          if (prop.inherit) {
            return {
              ...prop,
              inherit: {
                ...prop.inherit,
                property: prop.inherit.property.toString(),
              },
            };
          }

          if (prop.inherit === false) {
            const { inheritProperty, inherit, ...newProp } = prop;
            return newProp;
          }
          return prop;
        })
      );

      await db.collection('templates').updateOne({ _id: template._id }, { $set: { properties } });
    }
  },
};
