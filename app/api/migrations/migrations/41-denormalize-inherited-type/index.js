export default {
  delta: 41,

  name: 'denormalize-inherited-type',

  description: 'Denormalize the type of inherited properties in templates',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = await db.collection('templates').find();

    while (await cursor.hasNext()) {
      const template = await cursor.next();
      if (!template.properties) {
        continue;
      }
      const properties = await Promise.all(
        template.properties.map(async prop => {
          if (prop.inherit) {
            const [inheritedTemplate] = await db
              .collection('templates')
              .find({ 'properties._id': prop.inheritProperty })
              .toArray();

            const inheritedProperty = inheritedTemplate.properties.find(
              p => p._id.toString() === prop.inheritProperty.toString()
            );

            prop.inherit = {
              property: inheritedProperty._id,
              type: inheritedProperty.type,
            };

            delete prop.inheritProperty;
          }

          return prop;
        })
      );

      await db.collection('templates').updateOne({ _id: template._id }, { $set: { properties } });
    }
  },
};
