import { Db, ObjectId } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Entity, Fixture } from '../types';
import {
  fixtures,
  noDefaultTemplate,
  correctFixture,
  template1,
  template2,
  template3,
} from './fixtures';

let db: Db | null;
let entityTemplatesInDB: (ObjectId | undefined)[] = [];

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  await migration.up(db);
  entityTemplatesInDB = (await db.collection<Entity>('entities').find({}).toArray()).map(
    e => e.template
  );
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(161);
  });

  describe('on collections without a default template', () => {
    beforeAll(async () => {
      await initTest(noDefaultTemplate);
    });

    it('should not fail', async () => {
      await expect(migration.up(db!)).resolves.not.toThrow();
    });

    it('should not change the entities', async () => {
      expect(entityTemplatesInDB).toEqual([
        template1,
        template2,
        undefined,
        template2,
        null,
        template3,
        null,
      ]);
    });

    it('should not signal reindex', () => {
      expect(migration.reindex).toBe(false);
    });
  });

  describe('on collections where no entity template is missing', () => {
    beforeAll(async () => {
      await initTest(correctFixture);
    });

    it('should not change the entities', async () => {
      expect(entityTemplatesInDB).toEqual([template1, template2, template3]);
    });

    it('should not signal reindex', () => {
      expect(migration.reindex).toBe(false);
    });
  });

  describe('on collections with missing entity templates', () => {
    beforeAll(async () => {
      await initTest(fixtures);
    });

    it('should add the default template to the missing entities', async () => {
      expect(entityTemplatesInDB).toEqual([
        template1,
        template2,
        template2,
        template2,
        template2,
        template3,
        template2,
      ]);
    });

    it('should signal reindex', () => {
      expect(migration.reindex).toBe(true);
    });
  });
});
