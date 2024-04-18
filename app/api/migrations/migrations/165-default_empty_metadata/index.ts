/* eslint-disable no-await-in-loop */
import { Db } from 'mongodb';
import { Entity, Template } from './types';

let entitiesToUpdate: Entity[] = [];

const propDoesNotExist = (obj: Record<string, unknown>, prop: string) =>
  !obj.hasOwnProperty(prop) || obj[prop] === null || obj[prop] === undefined;

export default {
  delta: 165,

  name: 'default_empty_metadata',

  description: 'Adds empty array as default metadata for all entities.',

  batchSize: 1000,

  reindex: false,

  propertiesByTemplate: {} as Record<string, string[]>,

  fullEmptyMetadataByTemplate: {} as Record<string, Record<string, []>>,

  async readProperties(db: Db) {
    const templates = await db.collection<Template>('templates').find().toArray();
    this.propertiesByTemplate = {};
    this.fullEmptyMetadataByTemplate = {};
    templates.forEach(template => {
      const properties = template.properties?.map(property => property.name) || [];
      const idString = template._id?.toString() || '';
      this.propertiesByTemplate[idString] = properties;
      this.fullEmptyMetadataByTemplate[idString] = {};
      properties.forEach(property => {
        this.fullEmptyMetadataByTemplate[idString][property] = [];
      });
    });
  },

  async flushUpdates(db: Db) {
    if (!entitiesToUpdate.length) return;
    const entitiesCollection = db.collection<Entity>('entities');
    const operations = entitiesToUpdate.map(entity => ({
      updateOne: {
        filter: { _id: entity._id },
        update: { $set: entity },
      },
    }));
    await entitiesCollection.bulkWrite(operations);
    this.reindex = true;
    entitiesToUpdate = [];
  },

  async performUpdates(db: Db) {
    if (entitiesToUpdate.length >= this.batchSize) {
      await this.flushUpdates(db);
    }
  },

  repairMetadata(templateId: string) {
    return { newMetadata: this.fullEmptyMetadataByTemplate[templateId], repaired: true };
  },

  repairProperties(templateId: string, entity: Entity) {
    const properties = this.propertiesByTemplate[templateId];
    const newMetadata = { ...(entity.metadata || {}) };
    const missingProperties = properties.filter(prop => propDoesNotExist(newMetadata, prop));
    if (missingProperties.length) {
      missingProperties.forEach(prop => {
        newMetadata[prop] = [];
      });
    }
    return { newMetadata, repaired: missingProperties.length > 0 };
  },

  repairEntity(entity: Entity) {
    const templateId = entity.template?.toString() || '';
    let repaired = false;
    let newMetadata: NonNullable<Entity['metadata']> = {};
    if (propDoesNotExist(entity, 'metadata')) {
      ({ newMetadata, repaired } = this.repairMetadata(templateId));
    } else {
      ({ newMetadata, repaired } = this.repairProperties(templateId, entity));
    }
    return { newEntity: { ...entity, metadata: newMetadata }, repaired };
  },

  async handleEntity(db: Db, entity: Entity | null) {
    if (!entity) return;
    const { newEntity, repaired } = this.repairEntity(entity);
    if (repaired) {
      entitiesToUpdate.push(newEntity);
      await this.performUpdates(db);
    }
  },

  async handleEntities(db: Db) {
    const entitiesCollection = db.collection<Entity>('entities');
    const entityCursor = entitiesCollection.find({});

    while (await entityCursor.hasNext()) {
      const entity = await entityCursor.next();
      await this.handleEntity(db, entity);
    }
    if (entitiesToUpdate.length) {
      await this.flushUpdates(db);
    }
  },

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    await this.readProperties(db);
    await this.handleEntities(db);
  },
};
