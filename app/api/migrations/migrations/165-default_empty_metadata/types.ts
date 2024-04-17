import { ObjectId } from 'mongodb';

type LanguageKey = 'en' | 'es';

type Language = {
  _id?: ObjectId;
  label: string;
  key: LanguageKey;
  default?: boolean;
};
interface Settings {
  _id?: ObjectId;
  languages?: Language[];
}

type PropertyType = 'relationship' | 'select' | 'text';

interface PropertySchema {
  _id?: ObjectId;
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

interface Template {
  _id?: ObjectId;
  name: string;
  properties?: PropertySchema[];
  [k: string]: unknown | undefined;
}

type PropertyValueSchema = null | string;

interface SelectParentSchema {
  label: string;
  value: string;
}

interface InheritedValueSchema {
  value: PropertyValueSchema;
  label?: string;
  parent?: SelectParentSchema;
  [k: string]: unknown | undefined;
}

interface MetadataObject {
  value: PropertyValueSchema;
  label?: string;
  inheritedValue?: InheritedValueSchema[];
  inheritedType?: string;
  parent?: SelectParentSchema;
  [k: string]: unknown | undefined;
}

interface Metadata {
  [k: string]: MetadataObject[];
}

interface Entity {
  _id?: ObjectId;
  template?: ObjectId;
  sharedId?: string;
  language?: string;
  title?: string;
  metadata?: Metadata;
  [k: string]: unknown | undefined;
}

interface Fixture {
  settings: Settings[];
  templates: Template[];
  entities: Entity[];
}

export type { Entity, Fixture, Template };
