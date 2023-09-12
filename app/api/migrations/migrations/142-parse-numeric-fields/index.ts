/* eslint-disable no-await-in-loop */
import { Db, ObjectId } from 'mongodb';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { EntitySchema, TemplateSchema } from './types';

export default {
  delta: 142,

  name: 'parse-numeric-fields',

  description: 'Parse numeric fields stored as strings to their float representation',

  reindex: true,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const templates = objectIndex(
      await db.collection<TemplateSchema>('templates').find({}).toArray(),
      template => template._id.toString(),
      template => ({
        ...template,
        properties: objectIndex(
          template.properties || [],
          property => property.name,
          property => property
        ),
      })
    );

    const cursor = db.collection<EntitySchema>('entities').find({}, { sort: { _id: 1 } });
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      const template = templates[entity!.template!.toString()];
      const updates: Record<string, [{ value: number }]> = {};

      Object.keys(entity!.metadata || {}).forEach(propertyName => {
        if (template.properties[propertyName].type === 'numeric') {
          const candidateValue = entity!.metadata?.[propertyName]?.[0].value;
          if (typeof candidateValue === 'string') {
            updates[`metadata.${propertyName}`] = [{ value: parseFloat(candidateValue) }];
          }
        }
      });

      if (Object.keys(updates).length > 0) {
        await db
          .collection<EntitySchema>('entities')
          .updateOne({ _id: new ObjectId(entity!._id) }, { $set: updates });
      }
    }
  },
};
