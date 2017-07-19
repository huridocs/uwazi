import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const connectionSchema = new mongoose.Schema({
  sourceDocument: {type: String, index: true},
  sourceProperty: String,
  sourceType: String,
  relationType: String,
  targetDocument: {type: String, index: true},
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
