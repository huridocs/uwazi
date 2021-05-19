import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { TemplateSchema } from '../../shared/types/templateType';

const mongoSchema = new mongoose.Schema(
  {
    name: String,
    color: { type: String, default: '' },
    default: Boolean,
    properties: [new mongoose.Schema({}, {strict: false})],
    commonProperties: [new mongoose.Schema({}, {strict: false})],
  },
  {
    emitIndexErrors: true,
    strict: false,
  }
);

export default instanceModel<TemplateSchema>('templates', mongoSchema);
