import { EventEmitter } from 'events';
import mongoose, { Model, Document } from 'mongoose';
import { ChangeStream, MongoError } from 'mongodb';
import { config } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import { handleError } from '#api/utils/index.js';
import { featureFlagsMongoSchema } from './featureFlags.js';
import { TENANT_FIELDS } from './tenant.js';
import type { TenantsDataSource } from './application/contracts/TenantsDataSource.js';
import { TenantsDataSourceFactory } from './infrastructure/TenantsDataSourceFactory.js';

import type { Tenant } from './tenant.js';

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
  featureFlags: featureFlagsMongoSchema,
  globalMatomo: { id: String, url: String },
  ciMatomoActive: Boolean,
  maintenance: Boolean,
});

type DBTenant = Partial<Tenant> & { name: string };
type TenantDocument = Document & DBTenant;

/** Keeps operational data written by other tools out of the running process. */
const toTenant = (record: Record<string, unknown>): DBTenant =>
  Object.fromEntries(
    TENANT_FIELDS.filter(field => record[field] !== undefined).map(field => [field, record[field]])
  ) as DBTenant;

class TenantsModel extends EventEmitter {
  model?: Model<TenantDocument>;

  tenantsDB: mongoose.Connection;

  collectionName: string;

  changeStream?: ChangeStream;

  private debounceTimer?: NodeJS.Timeout;

  private pendingChanges = false;

  private dataSource: TenantsDataSource;

  constructor(dataSource: TenantsDataSource = TenantsDataSourceFactory.default()) {
    super();
    this.collectionName = 'tenants';
    this.tenantsDB = DB.connectionForDB(config.SHARED_DB);
    this.dataSource = dataSource;
  }

  private initializeModel() {
    this.model = this.tenantsDB.model<TenantDocument>(this.collectionName, mongoSchema);

    this.changeStream = this.model.watch();
    this.changeStream.on('change', () => {
      this.pendingChanges = true;
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        if (!this.pendingChanges) {
          return;
        }
        this.pendingChanges = false;
        // Nothing awaits this timer, so a failed reload is reported rather than left to reject in
        // the background: the connection may well be gone by the time it fires.
        this.change().catch(handleError);
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
    return (await this.dataSource.all()).map(toTenant);
  }

  async setMaintenance(tenantName: string, maintenance: boolean) {
    await this.dataSource.upsert(tenantName, { maintenance });
  }

  async setTelemetryConfig(
    tenantName: string,
    telemetry: { enabled: boolean; sampleRate: number }
  ) {
    await this.dataSource.upsert(tenantName, { featureFlags: { telemetry } });
  }

  async setPrometheusConfig(
    tenantName: string,
    prometheus: { enabled: boolean; sampleRate: number }
  ) {
    await this.dataSource.upsert(tenantName, { featureFlags: { prometheus } });
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
