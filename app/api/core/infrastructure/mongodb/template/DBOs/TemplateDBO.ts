import { ObjectId } from 'mongodb';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';

export interface TemplateDBO extends TemplateSchema {
  _id: ObjectId;
  properties: PropertySchema[];
  commonProperties: [PropertySchema, ...PropertySchema[]];
}
