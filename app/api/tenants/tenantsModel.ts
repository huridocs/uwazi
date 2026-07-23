import { EventEmitter } from 'events';
import mongoose, { Model, Document } from 'mongoose';
import { ChangeStream, MongoError } from 'mongodb';
import { config } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import { handleError } from '#api/utils/index.js';

import type { Tenant } from './tenantContext.js';

const schemaValidator = {
  $jsonSchema: {
    bsonType: 'object',
    properties: {
      name: {
        bsonType: 'string',
        description: 'must be a string and is required',
        minLength: 1,
      },
    },
  },
};

const mongoSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  dbName: String,
  indexName: String,
  uploadedDocuments: String,
  attachments: String,
  customUploads: String,
  activityLogs: String,
  domain: String,
  featureFlags: {
    s3Storage: Boolean,
    esReplicas: Number,
    sync: Boolean,
    deactivateTestJob: Boolean,
    paragraphExtraction: Boolean,
    fileCacheHeaders: Boolean,
    themeCustomization: Boolean,
    v2Languages: Boolean,
    newHeader: Boolean,
    postgresThesauri: Boolean,
    postgresTemplates: Boolean,
    postgresEntities: Boolean,
    postgresFiles: Boolean,
    aiAssistant: Boolean,
    aiAssistantServiceUrl: String,
    v2UsersCreate: Boolean,
    v2UsersDelete: Boolean,
    v2UsersGet: Boolean,
    v2UsersUpdate: Boolean,
    telemetry: {
      enabled: Boolean,
      thresholdMs: Number,
    },
    prometheus: {
      enabled: Boolean,
      sampleRate: Number,
    },
  },
  globalMatomo: { id: String, url: String },
  ciMatomoActive: Boolean,
  maintenance: Boolean,
});

type DBTenant = Partial<Tenant> & { name: string };
type TenantDocument = Document & DBTenant;

class TenantsModel extends EventEmitter {
  model?: Model<TenantDocument>;

  tenantsDB: mongoose.Connection;

  collectionName: string;

  changeStream?: ChangeStream;

  private debounceTimer?: NodeJS.Timeout;

  private pendingChanges = false;

  constructor() {
    super();
    this.collectionName = 'tenants';
    this.tenantsDB = DB.connectionForDB(config.SHARED_DB);
  }

  private initializeModel() {
    this.model = this.tenantsDB.model<TenantDocument>(this.collectionName, mongoSchema);

    this.changeStream = this.model.watch();
    this.changeStream.on('change', () => {
      this.pendingChanges = true;
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(async () => {
        if (this.pendingChanges) {
          await this.change();
          this.pendingChanges = false;
        }
      }, 1000);
    });

    this.changeStream.on('error', (error: MongoError) => {
      //The $changeStream stage is only supported on replica sets
      if (error.code === 40573) {
        // mongo documentation and ts types says changeStream.close returns a promise
        // but actually it does not in the current version,
        // catching the promise to prevent the eslint error results in a "catch of undefined" error
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.changeStream?.close();
      } else {
        handleError(error);
      }
    });
  }

  async initialize() {
    const { db } = this.tenantsDB;
    if (!db) {
      throw new Error('Tenants db is undefined');
    }
    const collections = (await db.listCollections().toArray()).map(c => c.name);

    if (collections.includes(this.collectionName)) {
      await db.command({
        collMod: this.collectionName,
        validator: schemaValidator,
      });
    } else {
      await db.createCollection(this.collectionName, {
        validator: schemaValidator,
      });
    }

    this.initializeModel();
  }

  async closeChangeStream() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    await this.changeStream?.close();
  }

  async change() {
    const tenants = await this.get();
    this.emit('change', tenants);
  }

  async get() {
    if (!this.model) {
      throw new Error(
        'tenants model has not been initialized, make sure you called initialize() method'
      );
    }
    return this.model.find({}, Object.keys(mongoSchema.paths)).lean();
  }

  async setMaintenance(tenantName: string, maintenance: boolean) {
    if (!this.model) {
      throw new Error(
        'tenants model has not been initialized, make sure you called initialize() method'
      );
    }
    await this.model.updateOne({ name: tenantName }, { $set: { maintenance } });
  }

  async setTelemetryConfig(
    tenantName: string,
    telemetry: { enabled: boolean; thresholdMs: number }
  ) {
    if (!this.model) {
      throw new Error(
        'tenants model has not been initialized, make sure you called initialize() method'
      );
    }
    await this.model.updateOne(
      { name: tenantName },
      { $set: { 'featureFlags.telemetry': telemetry } }
    );
  }

  async setPrometheusConfig(
    tenantName: string,
    prometheus: { enabled: boolean; sampleRate: number }
  ) {
    if (!this.model) {
      throw new Error(
        'tenants model has not been initialized, make sure you called initialize() method'
      );
    }
    await this.model.updateOne(
      { name: tenantName },
      { $set: { 'featureFlags.prometheus': prometheus } }
    );
  }
}

const tenantsModel = async () => {
  const model = new TenantsModel();
  if (process.env.NODE_ENV !== 'test') {
    await model.initialize();
  }
  return model;
};

export { TenantsModel, tenantsModel };
export type { DBTenant, TenantDocument };
