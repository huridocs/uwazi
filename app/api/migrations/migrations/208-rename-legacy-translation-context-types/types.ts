import { ObjectId } from 'mongodb';

type TranslationContext = {
  id: string;
  type: string;
  label: string;
};

type Translation = {
  _id: ObjectId;
  language: string;
  key: string;
  value: string;
  context: TranslationContext;
};

interface Fixture {
  translationsV2: Translation[];
}

export type { Fixture, Translation };
