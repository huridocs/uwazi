import { ObjectId } from 'mongodb';

interface Entity {
  _id: ObjectId;
  title: string;
  [k: string]: unknown | undefined;
}

interface Fixture {
  entities: Entity[];
}

export type { Entity, Fixture };
