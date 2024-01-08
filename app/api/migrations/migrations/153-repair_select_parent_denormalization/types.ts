import { ObjectId } from 'mongodb';

interface Thesaurus {
  _id?: ObjectId;
  name: string;
  values?: ThesaurusValue[];
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

interface Fixture {
  dictionaries?: Thesaurus[];
  templates?: Template[];
  relationtypes?: RelationType[];
}

export type { Fixture, Thesaurus, ThesaurusValue, Template };
