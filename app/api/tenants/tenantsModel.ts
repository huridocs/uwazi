import { EventEmitter } from 'events';
import mongoose, { Model, Document } from 'mongoose';
import { config } from 'api/config';
import { DB } from 'api/odm/DB';
import handleError from 'api/utils/handleError.js';
import { MongoError } from 'mongodb';

import { Tenant } from './tenantContext';

const mongoSchema = new mongoose.Schema({
  name: String,
  dbName: String,
  indexName: String,
  uploadedDocuments: String,
  attachments: String,
  customUploads: String,
  temporalFiles: String,
});

export class TenantsModel extends EventEmitter {
  model: Model<Document & Tenant>;

  constructor() {
    super();
    const tenantsDB = DB.connectionForDB(config.SHARED_DB);
    this.model = tenantsDB.model('tenants', mongoSchema);

    const changeStream = this.model.watch();
    changeStream.on('change', () => {
      this.change().catch(handleError);
    });

    changeStream.on('error', (error: MongoError) => {
      //The $changeStream stage is only supported on replica sets
      if (error.code === 40573) {
        // mongo documentation and ts types says changeStream.close returns a promise
        // but actually it does not in the current version,
        // catching the promise to prevent the eslint error results in a "catch of undefined" error
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        changeStream.close();
      } else {
        handleError(error);
      }
    });
  }

  async change() {
    const tenants = await this.get();
    this.emit('change', tenants);
  }

  async get() {
    return this.model.find();
  }
}
