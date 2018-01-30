import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const relationshipsSchema = new mongoose.Schema({
  entity: {type: String, index: true},
  hub: {type: mongoose.Schema.Types.ObjectId, index: true},
  template: {type: mongoose.Schema.Types.ObjectId, ref: 'relationTypes', index: true},
  metadata: mongoose.Schema.Types.Mixed,
  language: String,
  range: {
    start: Number,
    end: Number,
    text: String
  }
});

let Model = mongoose.model('connections', relationshipsSchema);
export default instanceModel(Model);
