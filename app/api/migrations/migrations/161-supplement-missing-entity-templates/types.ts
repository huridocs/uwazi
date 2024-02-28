import { ObjectId } from 'mongodb';

interface Entity {
  _id?: ObjectId;
  sharedId?: string;
  title?: string;
  template?: ObjectId;
  [k: string]: unknown | undefined;
}

interface Template {
  _id?: ObjectId;
  name: string;
  default?: boolean;
  [k: string]: unknown | undefined;
}

interface Fixture {
  entities: Entity[];
  templates: Template[];
}

export type { Entity, Fixture, Template };
