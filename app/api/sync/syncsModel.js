import mongoose from 'mongoose';

const syncSchema = new mongoose.Schema({
  lastSync: Number,
});

export default mongoose.model('syncs', syncSchema);

