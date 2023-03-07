/* eslint-disable no-await-in-loop */
import { ObjectId } from 'mongodb';

export default {
  delta: 45,

  name: 'denormalize-inherited-type',

  description: 'Denormalize the type of inherited properties in templates',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = await db.collection('templates').find({ properties: { $exists: true } });

    while (await cursor.hasNext()) {
      const template = await cursor.next();
      const properties = await Promise.all(
        template.properties.map(async prop => {
          if (prop.inherit) {
            const [inheritedTemplate] = await db
              .collection('templates')
              .find({ 'properties._id': new ObjectId(prop.inheritProperty) })
              .toArray();

            const inheritedProperty = inheritedTemplate.properties.find(
              p => p._id.toString() === prop.inheritProperty.toString()
            );

            const { inheritProperty, ...newProp } = prop;
            newProp.inherit = {
              property: inheritedProperty._id,
              type: inheritedProperty.type,
            };
            return newProp;
          }

          return prop;
        })
      );

      await db.collection('templates').updateOne({ _id: template._id }, { $set: { properties } });
    }
  },
};
