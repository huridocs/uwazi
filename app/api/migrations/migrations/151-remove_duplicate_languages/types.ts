import { ObjectId } from 'mongodb';

type Language = {
  label: string;
  key: string;
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
  metadata?: {
    content?: string;
  };
}

interface Template {
  name: string;
}

interface Entity {
  sharedId?: string;
  language?: string;
  title?: string;
  template?: ObjectId;
}

type Fixture = {
  settings: Settings[];
  pages: Page[];
  templates: Template[];
  entities: Entity[];
};

export type { Settings, Page, Template, Entity, Language, LanguagesList, Fixture };
