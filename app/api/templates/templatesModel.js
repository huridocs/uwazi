import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const propertiesSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: String,
  content: String,
  relationType: String,
  name: String,
  filter: Boolean,
  noLabel: Boolean,
  fullWidth: Boolean,
  defaultfilter: Boolean,
  required: Boolean,
  sortable: Boolean,
  showInCard: Boolean,
  prioritySorting: Boolean,
  style: String,
  nestedProperties: [String]
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

export default instanceModel('templates', templateSchema);
