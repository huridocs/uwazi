import mongoose from 'mongoose';

import { instanceModel } from 'api/odm';

const importedVaultEvidences = new mongoose.Schema({
  request: String,
});

const Model = instanceModel('importedVaultEvidences', importedVaultEvidences);

export default Model;
