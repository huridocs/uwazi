import { ObjectId } from 'mongodb';

type Language = {
  label: string;
  key: 'en' | 'es' | 'fr';
  default?: boolean;
};

type LanguagesList = Language[];
interface Settings {
  languages?: LanguagesList;
}

interface Page {
  title: string;
  language?: string;
  sharedId?: string;
}

interface Template {
  _id?: ObjectId;
  name: string;
}

interface Entity {
  sharedId?: string;
  language?: string;
  title?: string;
  template?: ObjectId;
  [k: string]: unknown | undefined;
}

type Fixture = {
  settings: Settings[];
  pages?: Page[];
  templates?: Template[];
  entities?: Entity[];
};

export type { Settings, Page, Template, Entity, Language, LanguagesList, Fixture };
