import mongoose from 'mongoose';

const propertiesSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: String,
  content: String,
  name: String,
  filter: Boolean,
  sortable: Boolean,
  showInCard: Boolean,
  nestedProperties: [{
    key: String,
    label: String
  }]
});

const templateSchema = new mongoose.Schema({
  name: String,
  isEntity: Boolean,
  properties: [propertiesSchema]
});

let Model = mongoose.model('templates', templateSchema);
export default Model;
