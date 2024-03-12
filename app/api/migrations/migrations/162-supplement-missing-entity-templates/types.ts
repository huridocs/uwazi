import { ObjectId } from 'mongodb';

interface Language {
  _id?: ObjectId;
  label: string;
  key: 'es' | 'en';
  default?: boolean;
}

interface Settings {
  _id?: ObjectId;
  languages?: Language[];
}

interface TranslationDBO {
  _id: ObjectId;
  language: 'es' | 'en';
  key: string;
  value: string;
  context: {
    type: 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';
    label: string;
    id: string;
  };
}

interface Entity {
  _id?: ObjectId;
  sharedId?: string;
  title?: string;
  template?: ObjectId;
  language?: string;
  published?: boolean;
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
  settings: Settings[];
  translationsV2: TranslationDBO[];
}

export type { Entity, Fixture, Template, Settings, TranslationDBO, Language };
