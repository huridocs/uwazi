import { ObjectId } from 'mongodb';

interface MetadataObject {
  value: string | null;
  label?: string | null;
  [k: string]: unknown;
}

interface Metadata {
  [k: string]: MetadataObject[] | unknown;
}

interface Entity {
  _id: ObjectId;
  template?: ObjectId;
  sharedId?: string;
  language?: string;
  title?: string;
  metadata?: Metadata;
  [k: string]: unknown;
}

interface PropertySchema {
  _id?: ObjectId;
  label: string;
  name: string;
  type: string;
}

interface Template {
  _id?: ObjectId;
  name: string;
  properties?: PropertySchema[];
  [k: string]: unknown;
}

interface Fixture {
  templates: Template[];
  entities: Entity[];
}

export type { Entity, Fixture, Template, MetadataObject };
