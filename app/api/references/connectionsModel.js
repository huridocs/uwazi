import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const connectionSchema = new mongoose.Schema({
  sourceDocument: String,
  sourceProperty: String,
  sourceType: String,
  targetDocument: String,
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
