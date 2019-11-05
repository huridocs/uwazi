import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';

const dictionarySchema = new mongoose.Schema({
  name: String,
  values: [{
    id: String,
    label: { type: String },
    values: mongoose.Schema.Types.Mixed,
  }]
});

export default instanceModel('dictionaries', dictionarySchema);
