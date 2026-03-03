import { ObjectId } from 'mongodb';
import { ThesaurusSchema } from '#shared/types/thesaurusType';

interface DateRangeValue {
  from?: number | null;
  to?: number | null;
}

interface MetadataObject {
  value: string | null | DateRangeValue;
  label?: string | null;
  inheritedValue?: { value: string | null; label?: string; [k: string]: unknown }[];
  inheritedType?: string;
  parent?: { label: string; value: string };
  [k: string]: unknown;
}

interface Metadata {
  [k: string]: MetadataObject[];
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
  content?: string;
}

interface Template {
  _id?: ObjectId;
  name: string;
  properties?: PropertySchema[];
  [k: string]: unknown;
}

interface ThesaurusValue {
  id: string;
  label: string;
  values?: { id: string; label: string }[];
}

interface Dictionary {
  _id: ObjectId;
  name: string;
  values: ThesaurusValue[];
}

interface Fixture {
  templates: Template[];
  entities: Entity[];
  dictionaries?: ThesaurusSchema[];
}

export type {
  Entity,
  Fixture,
  Template,
  MetadataObject,
  Dictionary,
  ThesaurusValue,
  DateRangeValue,
};
