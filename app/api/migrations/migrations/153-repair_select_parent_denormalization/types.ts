import { ObjectId } from 'mongodb';

interface Thesaurus {
  _id?: ObjectId;
  name: string;
  values?: ThesaurusValue[];
  [k: string]: unknown | undefined;
}

interface ThesaurusValueBase {
  _id?: ObjectId;
  id?: string;
  label: string;
}

type ThesaurusValue = ThesaurusValueBase & {
  values?: ThesaurusValueBase[];
};

type PropertyTypes =
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

interface PropertySchema {
  _id?: ObjectId;
  label: string;
  name: string;
  type: PropertyTypes;
  content?: string;
  relationType?: string;
  inherit?: {
    property?: string;
    type?: PropertyTypes;
  };
}

interface RelationType {
  _id?: ObjectId;
  name: string;
}

interface Template {
  _id?: ObjectId;
  name: string;
  properties?: PropertySchema[];
}

type PropertyValueSchema = null | string | number | boolean;

interface MetadataObjectSchema {
  value: PropertyValueSchema;
  label?: string;
  [k: string]: unknown | undefined;
  inheritedValue?: {
    value: PropertyValueSchema;
    label?: string;
  }[];
  inheritedType?: string;
  parent?: {
    value: string;
    label: string;
  };
}

interface Metadata {
  [k: string]: MetadataObjectSchema[] | undefined;
}

interface EntitySchema {
  _id?: ObjectId;
  sharedId?: string;
  language?: string;
  title?: string;
  template?: ObjectId;
  metadata?: Metadata;
  [k: string]: unknown | undefined;
}

type TestedLanguages = 'en' | 'es' | 'pt';

interface Translation {
  _id: ObjectId;
  language: TestedLanguages;
  key: string;
  value: string;
  context: {
    type: 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';
    label: string;
    id: string;
  };
}

interface Fixture {
  dictionaries?: Thesaurus[];
  translationsV2?: Translation[];
  templates?: Template[];
  relationtypes?: RelationType[];
  entities?: EntitySchema[];
}

export type { EntitySchema, Fixture, Thesaurus, ThesaurusValue, Template, Translation, Metadata };
