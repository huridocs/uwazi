/* eslint-disable no-await-in-loop */
import { Db, FindCursor } from 'mongodb';
import { Entity, Metadata, Template } from './types';

export default {
  delta: 161,

  name: 'denormalize_published_state',

  description:
    'This migration denormalizes the published state of the related entity in relationship metadata.',

  reindex: false,

  batchSize: 1000,

  db: null as Db | null,

  relationshipPropertyNames: new Set<string>(),

  entitiesToUpdate: [] as Entity[],

  entitiesCursor: null as FindCursor<Entity> | null,

  currentEntityBatch: [] as Entity[],

  referredPublicSharedIdsInCurrentBatch: new Set<string>(),

  async getRelationshipPropertyNames() {
    const templates = await this.db!.collection<Template>('templates').find().toArray();
    templates.forEach(template => {
      template.properties?.forEach(property => {
        if (property.type === 'relationship') {
          this.relationshipPropertyNames.add(property.name);
        }
      });
    });
  },

  propertyIsRelationship(propertyName: string) {
    return this.relationshipPropertyNames.has(propertyName);
  },

  async performUpdates(force: boolean = false) {
    if (this.entitiesToUpdate.length === 0) return;
    if (this.entitiesToUpdate.length >= this.batchSize || force) {
      const updateActions = this.entitiesToUpdate.map(entity => ({
        updateOne: {
          filter: { _id: entity._id },
          update: { $set: { metadata: entity.metadata } },
        },
      }));
      await this.db!.collection<Entity>('entities').bulkWrite(updateActions);
      this.entitiesToUpdate = [];
      this.reindex = true;
    }
  },

  async pushToUpdateBatch(entity: Entity) {
    this.entitiesToUpdate.push(entity);
    await this.performUpdates();
  },

  sharedIdIsReferredAndPublic(sharedId: string) {
    return this.referredPublicSharedIdsInCurrentBatch.has(sharedId);
  },

  async handleEntity(entity: Entity) {
    let updated: boolean = false;
    const newMetadata: Metadata = {};
    Object.entries(entity.metadata || {}).forEach(([propertyName, metadataObjects]) => {
      if (metadataObjects) {
        const newMetadataObjects = metadataObjects.map(metadataObject => {
          if (this.propertyIsRelationship(propertyName)) {
            updated = true;
            return {
              ...metadataObject,
              published: this.sharedIdIsReferredAndPublic(metadataObject.value),
            };
          }
          return metadataObject;
        });
        newMetadata[propertyName] = newMetadataObjects;
      }
    });
    if (updated) {
      await this.pushToUpdateBatch({ ...entity, metadata: newMetadata });
    }
  },

  async getNextBatch() {
    this.currentEntityBatch = [];
    while (
      this.currentEntityBatch.length < this.batchSize &&
      (await this.entitiesCursor!.hasNext())
    ) {
      const entity = await this.entitiesCursor!.next();
      if (!entity) break;
      this.currentEntityBatch.push(entity);
    }
  },

  setupCursor() {
    this.entitiesCursor = this.db!.collection<Entity>('entities').find();
  },

  async filterPublicSharedIds(sharedIds: Set<string>) {
    const filtered = (
      await this.db!.collection<Entity>('entities')
        .find(
          {
            sharedId: { $in: Array.from(sharedIds) },
            published: true,
          },
          {
            projection: { sharedId: 1 },
          }
        )
        .toArray()
    )
      .map(entity => entity.sharedId)
      .filter(sharedId => sharedId);
    return new Set(filtered) as Set<string>;
  },

  async readReferredPublicSharedIds() {
    const allReferredPublicSharedIds = new Set<string>();
    this.currentEntityBatch.forEach(entity => {
      Object.entries(entity.metadata || {}).forEach(([propertyName, metadataObjects]) => {
        if (metadataObjects && this.propertyIsRelationship(propertyName)) {
          metadataObjects.forEach(metadataObject => {
            allReferredPublicSharedIds.add(metadataObject.value);
          });
        }
      });
    });
    this.referredPublicSharedIdsInCurrentBatch = await this.filterPublicSharedIds(
      allReferredPublicSharedIds
    );
  },

  async handleEntities() {
    this.setupCursor();
    while (await this.entitiesCursor!.hasNext()) {
      await this.getNextBatch();
      await this.readReferredPublicSharedIds();
      for (let i = 0; i < this.currentEntityBatch.length; i += 1) {
        await this.handleEntity(this.currentEntityBatch[i]);
      }
    }
    await this.performUpdates(true);
  },

  async up(db: Db) {
    this.db = db;
    await this.getRelationshipPropertyNames();
    await this.handleEntities();
  },
};
