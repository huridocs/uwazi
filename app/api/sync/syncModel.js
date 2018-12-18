import mongoose from 'mongoose';

import instanceModel from 'api/odm';

const syncSchema = new mongoose.Schema({
  lastSync: Number
});

export default instanceModel('sync', syncSchema);

