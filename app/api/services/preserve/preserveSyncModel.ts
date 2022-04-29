import mongoose from 'mongoose';

import { instanceModel } from 'api/odm';

const preserveSyncSchema = new mongoose.Schema({
  lastImport: String,
});

const preserveSyncModel = instanceModel('preserveSync', preserveSyncSchema);

export { preserveSyncModel };
