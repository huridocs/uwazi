/* eslint-disable no-await-in-loop */

export default {
  delta: 46,

  name: 'inherit-conflict',

  description: 'Disable inherit for conflicting inherited types',

  async up(db) {
    const cursor = await db.collection('templates').find({});

    while (await cursor.hasNext()) {
      const template = await cursor.next();
      const properties = await Promise.all(
        template.properties.map(async prop => {
          if (prop.inherit) {
            const matchingTemplates = await db
              .collection('templates')
              .find({ 'properties.name': prop.name })
              .toArray();

            const sameProps = matchingTemplates
              .reduce((props, tmpl) => props.concat(tmpl.properties), [])
              .filter(p => p.name === prop.name);

            const sameInheritConfigured = sameProps.every(
              p => p.inherit?.type === prop.inherit.type
            );

            if (sameInheritConfigured) {
              return prop;
            }

            const { inherit, ...newProp } = prop;
            return newProp;
          }

          return prop;
        })
      );

      await db.collection('templates').updateOne({ _id: template._id }, { $set: { properties } });
    }
    process.stdout.write(`${this.name}...\r\n`);
  },
};
