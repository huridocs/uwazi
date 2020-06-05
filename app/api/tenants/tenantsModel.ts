import { EventEmitter } from 'events';
import mongoose, { Model, Document } from 'mongoose';
import { config } from 'api/config';
import { DB } from 'api/odm/DB';
import handleError from 'api/utils/handleError.js';

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

    const changeStrem = this.model.watch();
    changeStrem.on('change', () => {
      this.change().catch(console.log);
    });

    changeStrem.on('error', () => {
      changeStrem.close().catch(handleError);
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
