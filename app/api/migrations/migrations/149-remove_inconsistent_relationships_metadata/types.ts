import { ObjectId } from 'mongodb';

type ObjectIdSchema = string | ObjectId;

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

type RelationshipType = {
  _id?: ObjectIdSchema;
  name: string;
};

interface PropertySchema {
  _id?: ObjectIdSchema;
  label: string;
  name: string;
  type: PropertyType;
  content?: string;
  relationType?: string;
  inherit?: {
    property?: string;
    type?: PropertyType;
  };
}

interface TemplateSchema {
  _id?: ObjectIdSchema;
  name: string;
  properties?: PropertySchema[];
}

type PropertyValueSchema = null | string | number | boolean;

interface MetadataObjectSchema {
  value: PropertyValueSchema;
  label?: string;
  inheritedValue?: {
    value: PropertyValueSchema;
    label?: string;
  }[];
  inheritedType?: string;
  [k: string]: unknown | undefined;
}

interface MetadataSchema {
  [k: string]: MetadataObjectSchema[] | undefined;
}

interface EntitySchema {
  _id?: ObjectIdSchema;
  sharedId?: string;
  language?: string;
  title?: string;
  template?: ObjectIdSchema;
  metadata?: MetadataSchema;
  [k: string]: unknown | undefined;
}

type FixtureType = {
  templates?: TemplateSchema[];
  entities?: EntitySchema[];
  relationTypes?: RelationshipType[];
};

export type { EntitySchema, FixtureType, PropertySchema, RelationshipType, TemplateSchema };
