import mongoose from 'mongoose';

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
  nestedProperties: [{
    key: String,
    label: String
  }]
});

const commonPropertiesSchema = new mongoose.Schema({
  isCommonProperty: Boolean,
  label: String,
  name: String,
  type: String,
  prioritySorting: Boolean
});

const templateSchema = new mongoose.Schema({
  name: String,
  isEntity: Boolean,
  properties: [propertiesSchema],
  commonProperties: [commonPropertiesSchema]
});

let Model = mongoose.model('templates', templateSchema);
export default Model;
