import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { TemplateSchema } from '../../shared/types/templateType';

const mongoSchema = new mongoose.Schema({
  name: String,
  color: { type: String, default: '' },
  default: Boolean,
  properties: [
    new mongoose.Schema({
      id: String,
      label: String,
      type: String,
      content: String,
      relationType: String,
      inheritProperty: String,
      name: String,
      filter: Boolean,
      inherit: Boolean,
      noLabel: Boolean,
      fullWidth: Boolean,
      defaultfilter: Boolean,
      required: Boolean,
      sortable: Boolean,
      showInCard: Boolean,
      prioritySorting: Boolean,
      style: String,
      nestedProperties: [String],
    }),
  ],
  commonProperties: [
    new mongoose.Schema({
      isCommonProperty: Boolean,
      label: String,
      name: String,
      type: String,
      prioritySorting: Boolean,
    }),
  ],
});

export default instanceModel<TemplateSchema>('templates', mongoSchema);
