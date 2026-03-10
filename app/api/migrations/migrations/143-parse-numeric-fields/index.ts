/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { Db, ObjectId } from 'mongodb';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { EntitySchema, TemplateSchema } from './types';

export default {
  delta: 143,

  name: 'parse-numeric-fields',

  description: 'Parse numeric fields stored as strings to their float representation',

  reindex: true,

  batchSize: 1000,

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

    let operations = [];
    const cursor = db.collection<EntitySchema>('entities').find({}, { sort: { _id: 1 } });
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      const templateId = entity!.template?.toString();
      if (!templateId) continue;
      const template = templates[templateId];
      if (!template) continue;
      const set: Record<string, [{ value: number }]> = {};
      const unset: Record<string, ''> = {};

      Object.keys(entity!.metadata || {}).forEach(propertyName => {
        if (template.properties?.[propertyName]?.type === 'numeric') {
          const candidateValue = entity!.metadata?.[propertyName]?.[0]?.value;
          if (typeof candidateValue === 'string') {
            if (candidateValue === '') {
              unset[`metadata.${propertyName}`] = '';
            } else {
              set[`metadata.${propertyName}`] = [{ value: parseFloat(candidateValue) }];
            }
          }
        }
      });

      if (Object.keys(set).length > 0) {
        operations.push({
          updateOne: { filter: { _id: new ObjectId(entity!._id) }, update: { $set: set } },
        });
      }

      if (Object.keys(unset).length > 0) {
        operations.push({
          updateOne: { filter: { _id: new ObjectId(entity!._id) }, update: { $unset: unset } },
        });
      }

      if (operations.length > this.batchSize) {
        await db.collection<EntitySchema>('entities').bulkWrite(operations);
        operations = [];
      }
    }

    if (operations.length) {
      await db.collection<EntitySchema>('entities').bulkWrite(operations);
    }
  },
};
