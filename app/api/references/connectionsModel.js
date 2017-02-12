import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  sourceDocument: String,
  sourceProperty: String,
  sourceType: String,
  targetDocument: String
});

let Model = mongoose.model('connections', connectionSchema);
export default Model;
