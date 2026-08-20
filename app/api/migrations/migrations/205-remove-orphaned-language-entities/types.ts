import { ObjectId } from 'mongodb';

type Language = {
  key: string;
  label?: string;
  default?: boolean;
};

interface Settings {
  _id?: ObjectId;
  languages?: Language[];
}

interface Entity {
  _id?: ObjectId;
  sharedId?: string;
  language?: string;
  title?: string;
  template?: ObjectId;
  [k: string]: unknown | undefined;
}

interface Fixture {
  settings: Settings[];
  templates?: Array<{ _id?: ObjectId; name: string }>;
  entities?: Entity[];
}

export type { Settings, Language, Entity, Fixture };
