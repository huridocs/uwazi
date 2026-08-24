import { ObjectId } from 'mongodb';

type TranslationContext = {
  id?: string;
  type?: string;
  label?: string;
};

type Translation = {
  _id: ObjectId;
  language: string;
  key: string;
  value: string;
  context: TranslationContext;
};

type NamedDocument = {
  _id: ObjectId;
  name: string;
};

interface Fixture {
  translationsV2: Translation[];
  templates: NamedDocument[];
  dictionaries: NamedDocument[];
  relationtypes: NamedDocument[];
}

export type { Fixture, Translation };
