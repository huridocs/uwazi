import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const searchSchema = new mongoose.Schema({
  language: String,
  searchTerm: String,
  status: String,
  documents: [{
    _id: false,
    sharedId: String,
    status: String
  }]
});

const Model = mongoose.model('semanticsearches', searchSchema);
export default instanceModel(Model);
