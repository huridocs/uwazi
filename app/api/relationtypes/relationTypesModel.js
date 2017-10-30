import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const propertiesSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: String,
  content: String,
  name: String,
  filter: Boolean,
  required: Boolean,
  sortable: Boolean,
  showInCard: Boolean,
  prioritySorting: Boolean,
  nestedProperties: [String]
});

const templateSchema = new mongoose.Schema({
  name: String,
  properties: [propertiesSchema]
});

let Model = mongoose.model('relationtypes', templateSchema);
export default instanceModel(Model);
