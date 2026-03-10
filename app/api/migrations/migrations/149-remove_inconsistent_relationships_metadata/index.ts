/* eslint-disable no-await-in-loop */
import { Db, FindCursor, ObjectId } from 'mongodb';
import { EntitySchema, TemplateSchema } from '../143-parse-numeric-fields/types';

type UpdateOperation = {
  updateOne: {
    filter: { _id: ObjectId };
    update: { $set: { metadata: EntitySchema['metadata'] } };
  };
};

export default {
  delta: 149,

  name: 'remove_inconsistent_relationships_metadata',

  description:
    'Removes entries from relationships properties in the metadata that do not have the referenced entity in the database.',

  reindex: false,

  batchSize: 1000,

  updates: [] as UpdateOperation[],

  async prepareTemplates(db: Db) {
    const templates = await db
      .collection<TemplateSchema>('templates')
      .find({ 'properties.type': 'relationship' })
      .toArray();
    const templateIds = templates.map(t => new ObjectId(t._id));
    const relationshipProperties = templates
      .map(t => t.properties || [])
      .flat()
      .filter(p => p.type === 'relationship');
    const relationshipPropertyNames = new Set(relationshipProperties.map(p => p.name));
    return { templateIds, relationshipPropertyNames };
  },

  async getNextBatch(entities: FindCursor<EntitySchema>) {
    const batch: EntitySchema[] = [];
    while (await entities.hasNext()) {
      const entity = await entities.next();
      if (entity) batch.push(entity);
      if (batch.length >= this.batchSize) {
        break;
      }
    }
    return batch;
  },

  updateObject(id: ObjectId, metadata: EntitySchema['metadata']): UpdateOperation {
    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: { metadata } },
      },
    };
  },

  async flushUpdates(db: Db, force = false) {
    if (this.updates.length > 0 && (force || this.updates.length >= this.batchSize)) {
      await db.collection<EntitySchema>('entities').bulkWrite(this.updates);
      this.reindex = true;
      this.updates = [];
    }
  },

  getRelatedSharedIds(entities: EntitySchema[], relationshipPropertyNames: Set<string>) {
    const relatedSharedIds: Set<string> = new Set();
    entities.forEach(entity => {
      Object.entries(entity.metadata || {}).forEach(([k, arr]) => {
        if (relationshipPropertyNames.has(k)) {
          (arr || []).forEach(v => {
            if (v.value && typeof v.value === 'string') {
              relatedSharedIds.add(v.value);
            }
          });
        }
      });
    });
    return Array.from(relatedSharedIds);
  },

  async filterExistingSharedIds(db: Db, sharedIds: string[]) {
    const existingRelatedSharedIds = await db
      .collection<EntitySchema>('entities')
      .aggregate([{ $match: { sharedId: { $in: sharedIds } } }, { $project: { sharedId: 1 } }])
      .toArray();
    return new Set(existingRelatedSharedIds.map(e => e.sharedId));
  },

  prepareEntityUpdates(
    entity: EntitySchema,
    relationshipPropertyNames: Set<string>,
    existingRelatedSharedIds: Set<string>
  ) {
    let updated = false;
    const oldMetadata = entity.metadata || {};
    const newMetadata: EntitySchema['metadata'] = { ...oldMetadata };
    Object.entries(oldMetadata).forEach(([k, arr]) => {
      if (relationshipPropertyNames.has(k)) {
        const original = arr || [];
        const filtered = original.filter(
          v => typeof v.value !== 'string' || existingRelatedSharedIds.has(v.value)
        );
        newMetadata[k] = filtered;
        if (filtered.length !== original.length) {
          updated = true;
        }
      } else {
        newMetadata[k] = arr;
      }
    });
    if (updated) {
      this.updates.push(this.updateObject(new ObjectId(entity._id!), newMetadata));
    }
  },

  prepareBatchUpdates(
    entities: EntitySchema[],
    relationshipPropertyNames: Set<string>,
    existingRelatedSharedIds: Set<string>
  ) {
    entities.forEach(entity =>
      this.prepareEntityUpdates(entity, relationshipPropertyNames, existingRelatedSharedIds)
    );
  },

  async updateEntities(db: Db, templateIds: ObjectId[], relationshipPropertyNames: Set<string>) {
    const entities = db
      .collection<EntitySchema>('entities')
      .find({ template: { $in: templateIds } });

    while (await entities.hasNext()) {
      const batch = await this.getNextBatch(entities);
      const relatedSharedIds = this.getRelatedSharedIds(batch, relationshipPropertyNames);
      const existingRelatedSharedIds = await this.filterExistingSharedIds(db, relatedSharedIds);
      this.prepareBatchUpdates(batch, relationshipPropertyNames, existingRelatedSharedIds);
      await this.flushUpdates(db);
    }
    await this.flushUpdates(db, true);
  },

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const { templateIds, relationshipPropertyNames } = await this.prepareTemplates(db);

    await this.updateEntities(db, templateIds, relationshipPropertyNames);
  },
};
