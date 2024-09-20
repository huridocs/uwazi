import { ObjectId } from 'mongodb';

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
  type: PropertyType;
  content?: string;
  inherit?: {
    property?: string;
    type?: PropertyType;
  };
}

interface Template {
  _id?: ObjectId;
  name: string;
  properties?: Property[];
}

interface MetadataObject {
  value: string;
  label?: string;
  published?: boolean;
  [k: string]: unknown | undefined;
}

interface Metadata {
  [k: string]: MetadataObject[] | undefined;
}

interface Entity {
  _id?: ObjectId;
  sharedId?: string;
  language?: string;
  title?: string;
  template?: ObjectId;
  published?: boolean;
  metadata?: Metadata;
  [k: string]: unknown | undefined;
}

interface Fixture {
  templates: Template[];
  entities: Entity[];
}

export type { Entity, Fixture, Metadata, Template };
