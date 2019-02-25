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
  }],
  creationDate: Number
});

export default instanceModel('semanticsearches', searchSchema);
