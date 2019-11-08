/** @format */

import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { TemplateSchema } from './templateType';

const mongoSchema = new mongoose.Schema({
  name: String,
  color: { type: String, default: '' },
  default: Boolean,
  properties: mongoose.Schema.Types.Mixed,
  commonProperties: mongoose.Schema.Types.Mixed,
});

export default instanceModel<TemplateSchema>('templates', mongoSchema);
