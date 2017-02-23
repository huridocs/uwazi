import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const dictionarySchema = new mongoose.Schema({
  name: String,
  values: [{
    id: String,
    label: String
  }]
});

let Model = mongoose.model('dictionaries', dictionarySchema);
export default instanceModel(Model);
