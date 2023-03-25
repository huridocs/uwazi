import { ObjectId } from 'mongodb';

export interface TemplateDBO {
  _id: ObjectId;
  name: string;
  // propertly type properties when migrating templates to v2
  properties: any[];
}
