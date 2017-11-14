import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const connectionSchema = new mongoose.Schema({
  sourceDocument: {type: String, index: true},
  sourceTemplate: {type: mongoose.Schema.Types.ObjectId, ref: 'templates'},
  sourceProperty: String,
  sourceType: String,
  relationType: String,
  targetDocument: {type: String, index: true},
  template: {type: mongoose.Schema.Types.ObjectId, ref: 'relationTypes', index: true},
  metadata: mongoose.Schema.Types.Mixed,
  sourceRange: {
    start: Number,
    end: Number,
    text: String
  },

  targetRange: {
    start: Number,
    end: Number,
    text: String
  }
});

let Model = mongoose.model('connections', connectionSchema);
export default instanceModel(Model);
