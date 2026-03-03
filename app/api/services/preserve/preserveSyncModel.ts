import mongoose from 'mongoose';

import { instanceModel } from '#api/odm/index.js';

const preserveSyncSchema = new mongoose.Schema({
  lastImport: String,
  token: String,
});

const preserveSyncModel = instanceModel('preserveSync', preserveSyncSchema);

export { preserveSyncModel };
