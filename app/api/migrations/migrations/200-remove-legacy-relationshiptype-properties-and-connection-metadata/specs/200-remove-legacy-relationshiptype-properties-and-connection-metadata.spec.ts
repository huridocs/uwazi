import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

let db: Db | null;

const initTest = async () => {
  await testingDB.setupFixturesAndContext(fixtures);
  db = testingDB.mongodb!;
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('200-remove-legacy-relationshiptype-properties-and-connection-metadata', () => {
  beforeEach(async () => {
    await initTest();
  });

  it('should have expected metadata', () => {
    expect(migration.delta).toBe(200);
    expect(migration.reindex).toBe(false);
    expect(migration.requiresSchema).toBe(5);
  });

  it('should remove relationtypes.properties when present', async () => {
    await migration.up(db!);

    const relationtypes = await db!.collection('relationtypes').find({}).toArray();
    const withLegacy = relationtypes.find(rt => rt.name === 'With legacy properties');
    const withoutLegacy = relationtypes.find(rt => rt.name === 'Without legacy properties');

    expect(withLegacy).toBeDefined();
    expect(withLegacy).not.toHaveProperty('properties');

    expect(withoutLegacy).toBeDefined();
    expect(withoutLegacy).not.toHaveProperty('properties');
  });

  it('should remove connections.metadata when present', async () => {
    await migration.up(db!);

    const connections = await db!.collection('connections').find({}).toArray();
    const withLegacy = connections.find(c => c.entity === 'entity-1');
    const withoutLegacy = connections.find(c => c.entity === 'entity-2');

    expect(withLegacy).toBeDefined();
    expect(withLegacy).not.toHaveProperty('metadata');

    expect(withoutLegacy).toBeDefined();
    expect(withoutLegacy).not.toHaveProperty('metadata');
  });

  it('should be idempotent', async () => {
    await migration.up(db!);
    await migration.up(db!);

    const relationtypes = await db!.collection('relationtypes').find({}).toArray();
    const connections = await db!.collection('connections').find({}).toArray();

    expect(relationtypes.every(rt => !Object.prototype.hasOwnProperty.call(rt, 'properties'))).toBe(
      true
    );
    expect(connections.every(c => !Object.prototype.hasOwnProperty.call(c, 'metadata'))).toBe(true);
  });
});
