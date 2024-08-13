import { EventEmitter } from 'events';
import mongoose, { Model, Document } from 'mongoose';
import { config } from 'api/config';
import { DB } from 'api/odm/DB';
import { handleError } from 'api/utils';
import { ChangeStream, MongoError } from 'mongodb';

import { Tenant } from './tenantContext';

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
  featureFlags: {
    s3Storage: Boolean,
  },
  globalMatomo: { id: String, url: String },
  ciMatomoActive: Boolean,
});

type DBTenant = Partial<Tenant> & { name: string };
type TenantDocument = Document & DBTenant;

class TenantsModel extends EventEmitter {
  model?: Model<TenantDocument>;

  tenantsDB: mongoose.Connection;

  collectionName: string;

  changeStream?: ChangeStream;

  constructor() {
    super();
    this.collectionName = 'tenants';
    this.tenantsDB = DB.connectionForDB(config.SHARED_DB);
  }

  private initializeModel() {
    this.model = this.tenantsDB.model<TenantDocument>(this.collectionName, mongoSchema);

    this.changeStream = this.model.watch();
    this.changeStream.on('change', () => {
      this.change().catch(handleError);
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
    const collections = (await this.tenantsDB.db.listCollections().toArray()).map(c => c.name);

    if (collections.includes(this.collectionName)) {
      await this.tenantsDB.db.command({
        collMod: this.collectionName,
        validator: schemaValidator,
      });
    } else {
      await this.tenantsDB.db.createCollection(this.collectionName, {
        validator: schemaValidator,
      });
    }

    this.initializeModel();
  }

  async closeChangeStream() {
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
}

const tenantsModel = async () => {
  const model = new TenantsModel();
  await model.initialize();
  return model;
};

export { TenantsModel, tenantsModel };
export type { DBTenant, TenantDocument };
