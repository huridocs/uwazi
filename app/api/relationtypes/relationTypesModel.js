import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const relationTypeSchema = new mongoose.Schema({
  name: String
});

let Model = mongoose.model('relationtypes', relationTypeSchema);
export default instanceModel(Model);
