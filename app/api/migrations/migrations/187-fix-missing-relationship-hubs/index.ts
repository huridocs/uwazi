/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';
import {
  Entity,
  Template,
  getRelationshipProperties,
  saveEntityBasedReferences,
} from './relationships.js';

export default {
  delta: 187,

  reindex: false,

  name: 'fix-missing-relationship-hubs',

  description:
    'Backfills missing V1 relationship hub entries for entities created via the V2 API ' +
    'that have relationship-type properties with non-empty values. ' +
    'Root cause: RelationshipSyncJob ran without a user in appContext, causing ' +
    'ModelWithPermissions to apply a { published: true } filter that silently excluded ' +
    'newly created unpublished entities, so saveEntityBasedReferences produced no hubs.',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const settings = await db.collection('settings').findOne({});
    const defaultLanguage: string =
      ((settings?.languages ?? []) as { key: string; default?: boolean }[]).find(l => l.default)
        ?.key ?? 'en';

    // Load all templates and keep only those with at least one relationship property
    const allTemplates = (await db.collection('templates').find({}).toArray()) as Template[];
    const relevantTemplates = allTemplates.filter(t => getRelationshipProperties(t).length > 0);

    if (!relevantTemplates.length) {
      process.stdout.write(`${this.name}: no templates with relationship properties found.\r\n`);
      return;
    }

    let processedCount = 0;

    for (const template of relevantTemplates) {
      const propNames = getRelationshipProperties(template).map(p => p.name);

      // Only process entities that have at least one non-empty value in a relationship property.
      // Checking metadata.<name>.0 is an idiomatic MongoDB way to assert the array is non-empty.
      const metadataFilter = {
        $or: propNames.map(name => ({ [`metadata.${name}.0`]: { $exists: true } })),
      };

      const cursor = db
        .collection('entities')
        .find(
          { template: template._id, language: defaultLanguage, ...metadataFilter },
          { projection: { _id: 1, sharedId: 1, language: 1, template: 1, metadata: 1 } }
        );

      while (await cursor.hasNext()) {
        const entity = (await cursor.next()) as Entity;
        if (entity) {
          await saveEntityBasedReferences(db, entity, defaultLanguage, template);
          processedCount += 1;
        }
      }
    }

    process.stdout.write(`${this.name}: processed ${processedCount} entities.\r\n`);
  },
};
