import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const resultSentenceSchema = new mongoose.Schema({
  sentence: String,
  score: Number
});

const resultSchema = new mongoose.Schema({
  sharedId: String,
  status: String,
  results: [resultSentenceSchema]
});

const searchSchema = new mongoose.Schema({
  language: String,
  searchTerm: String,
  status: String,
  documents: [resultSchema]
});

let Model = mongoose.model('semanticsearches', searchSchema);
export default instanceModel(Model);
