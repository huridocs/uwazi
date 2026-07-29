import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';

type RelationTypeFixture = {
  _id: ObjectId;
  name: string;
  properties?: unknown[];
};

type ConnectionFixture = {
  _id: ObjectId;
  entity: string;
  hub: ObjectId;
  template: ObjectId;
  metadata?: Record<string, unknown>;
};

interface Fixture extends DBFixture {
  relationtypes: RelationTypeFixture[];
  connections: ConnectionFixture[];
}

export type { Fixture, RelationTypeFixture, ConnectionFixture };
