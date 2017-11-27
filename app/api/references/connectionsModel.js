import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const connectionSchema = new mongoose.Schema({
  entity: {type: String, index: true},
  entityTemplate: {type: mongoose.Schema.Types.ObjectId, ref: 'templates'},
  entityProperty: String,
  entityType: String,
  hub: {type: mongoose.Schema.Types.ObjectId, index: true},
  template: {type: mongoose.Schema.Types.ObjectId, ref: 'relationTypes', index: true},
  metadata: mongoose.Schema.Types.Mixed,
  range: {
    start: Number,
    end: Number,
    text: String
  }
});

let Model = mongoose.model('connections', connectionSchema);
export default instanceModel(Model);
