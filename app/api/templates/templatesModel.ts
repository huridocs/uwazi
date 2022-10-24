import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { TemplateSchema } from '../../shared/types/templateType';

const mongoSchema = new mongoose.Schema(
  {
    color: { type: String, default: '' },
    properties: [new mongoose.Schema({ id: String, content: String }, { strict: false })],
    commonProperties: [new mongoose.Schema({ id: String }, { strict: false })],
    entityViewPage: { type: String, default: '' },
  },
  {
    strict: false,
  }
);

export default instanceModel<TemplateSchema>('templates', mongoSchema);
