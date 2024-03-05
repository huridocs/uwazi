import { ObjectId } from 'mongodb';

interface Entity {
  _id?: ObjectId;
  sharedId?: string;
  title?: string;
  template?: ObjectId;
  [k: string]: unknown | undefined;
}

type PropertyType =
  | 'date'
  | 'daterange'
  | 'geolocation'
  | 'image'
  | 'link'
  | 'markdown'
  | 'media'
  | 'multidate'
  | 'multidaterange'
  | 'multiselect'
  | 'nested'
  | 'numeric'
  | 'preview'
  | 'relationship'
  | 'select'
  | 'text'
  | 'generatedid'
  | 'newRelationship';

interface Property {
  _id?: ObjectId;
  label: string;
  name: string;
  isCommonProperty?: boolean;
  type: PropertyType;
  prioritySorting?: boolean;
}

interface Template {
  _id?: ObjectId;
  name: string;
  color?: string;
  default?: boolean;
  /**
   * @minItems 1
   */
  commonProperties?: [Property, ...Property[]];
  properties?: Property[];
  [k: string]: unknown | undefined;
}

interface Fixture {
  entities: Entity[];
  templates: Template[];
}

export type { Entity, Fixture, Template };
