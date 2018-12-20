import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const resultSchema = new mongoose.Schema({
  sharedId: String,
  searchId: String,
  status: String,
  results: [{
      sentence: String,
      score: Number,
      page: Number
  }]
});

const Model = mongoose.model('semanticsearchresults', resultSchema);
export default instanceModel(Model);
