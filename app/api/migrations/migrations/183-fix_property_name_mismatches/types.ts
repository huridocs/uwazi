import { ObjectId } from 'mongodb';

export interface PropertyChange {
  oldName: string;
  newName: string;
  label: string;
  type: string;
}

export interface Template {
  _id: ObjectId;
  name: string;
  properties?: Property[];
  commonProperties?: Property[];
}

export interface Property {
  _id?: ObjectId;
  label: string;
  name: string;
  type: string;
  content?: string;
  isCommonProperty?: boolean;
}

export interface Entity {
  _id: ObjectId;
  template: ObjectId;
  sharedId: string;
  title: string;
  language?: string;
  metadata: Record<string, MetadataValue[]>;
}

export interface MetadataValue {
  value: any;
  label?: string;
  attachment?: number;
  inheritedValue?: any[];
  inheritedType?: string;
  [k: string]: any;
}

export interface Settings {
  _id: ObjectId;
  newNameGeneration?: boolean;
}
