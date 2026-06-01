import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import {
  ThesaurusNameAlreadyExistsError,
  ThesaurusNotFoundError,
} from '#api/core/domain/thesaurus/errors.js';
import { PostgresThesauriDataSource } from '../PostgresThesauriDataSource.js';

const makeDS = () =>
  new PostgresThesauriDataSource({
    pool: testingPG.pool!,
    mongoDb: getConnection(),
  });

const makeThesaurus = (overrides: Partial<{ id: string; name: string; values: any[] }> = {}) =>
  new Thesaurus({
    id: overrides.id ?? new ObjectId().toHexString(),
    name: overrides.name ?? 'My Thesaurus',
    values: overrides.values ?? [
      { id: 'v1', label: 'Value 1' },
      { id: 'v2', label: 'Value 2' },
    ],
  });

beforeAll(async () => {
  await testingEnvironment.setUpPostgres();
});

beforeEach(async () => {
  await testingEnvironment.setUp({});
  await testingPG.clear(['thesauri']);
  await getConnection().collection('updatelogs').deleteMany({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresThesauriDataSource', () => {
  describe('create() + getById()', () => {
    it('should persist a thesaurus and retrieve it by id', async () => {
      const ds = makeDS();
      const thesaurus = makeThesaurus({ name: 'Countries' });

      await ds.create(thesaurus);

      const result = await ds.getById(thesaurus.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getData().id).toBe(thesaurus.id);
        expect(result.getData().name).toBe('Countries');
        expect(result.getData().values).toEqual(thesaurus.values);
      }
    });

    it('should preserve nested values', async () => {
      const ds = makeDS();
      const thesaurus = makeThesaurus({
        name: 'Regions',
        values: [
          {
            id: 'g1',
            label: 'Europe',
            values: [
              { id: 'g1-1', label: 'France' },
              { id: 'g1-2', label: 'Germany' },
            ],
          },
        ],
      });

      await ds.create(thesaurus);

      const result = await ds.getById(thesaurus.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getData().values[0].label).toBe('Europe');
        expect(result.getData().values[0].values).toHaveLength(2);
        expect(result.getData().values[0].values![0].label).toBe('France');
      }
    });
  });

  describe('getById()', () => {
    it('should return ThesaurusNotFoundError for unknown id', async () => {
      const ds = makeDS();
      const result = await ds.getById(new ObjectId().toHexString());

      expect(result.isOk()).toBe(false);
      if (!result.isOk()) {
        expect(result.getError()).toBeInstanceOf(ThesaurusNotFoundError);
      }
    });
  });

  describe('update()', () => {
    it('should update the name of a thesaurus', async () => {
      const ds = makeDS();
      const thesaurus = makeThesaurus({ name: 'Old Name' });
      await ds.create(thesaurus);

      const updated = thesaurus.update({ name: 'New Name' });
      await ds.update(updated);

      const result = await ds.getById(thesaurus.id);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getData().name).toBe('New Name');
      }
    });

    it('should replace values on update', async () => {
      const ds = makeDS();
      const thesaurus = makeThesaurus();
      await ds.create(thesaurus);

      const updated = thesaurus.update({
        values: [{ id: 'new1', label: 'New Value' }],
      });
      await ds.update(updated);

      const result = await ds.getById(thesaurus.id);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getData().values).toHaveLength(1);
        expect(result.getData().values[0].label).toBe('New Value');
      }
    });
  });

  describe('exists()', () => {
    it('should return ThesaurusNameAlreadyExistsError when name is taken by another record', async () => {
      const ds = makeDS();
      const first = makeThesaurus({ name: 'Duplicate Name' });
      const second = makeThesaurus({ name: 'Duplicate Name' });

      await ds.create(first);

      const result = await ds.exists(second);

      expect(result.isOk()).toBe(false);
      if (!result.isOk()) {
        expect(result.getError()).toBeInstanceOf(ThesaurusNameAlreadyExistsError);
      }
    });

    it('should return ok(false) when the same record has the same name (no self-conflict)', async () => {
      const ds = makeDS();
      const thesaurus = makeThesaurus({ name: 'Unique' });
      await ds.create(thesaurus);

      const result = await ds.exists(thesaurus);

      expect(result.isOk()).toBe(true);
    });

    it('should return ok(false) when no name conflict exists', async () => {
      const ds = makeDS();
      const thesaurus = makeThesaurus({ name: 'Definitely Unique' });

      const result = await ds.exists(thesaurus);

      expect(result.isOk()).toBe(true);
    });
  });

  describe('sync logs', () => {
    it('should write an updatelog entry after create', async () => {
      const ds = makeDS();
      const thesaurus = makeThesaurus();

      await ds.create(thesaurus);

      const logs = await getConnection().collection('updatelogs').find({}).toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].namespace).toBe('dictionaries');
    });

    it('should write an updatelog entry after update', async () => {
      const ds = makeDS();
      const thesaurus = makeThesaurus();
      await ds.create(thesaurus);

      await getConnection().collection('updatelogs').deleteMany({});

      const updated = thesaurus.update({ name: 'Updated' });
      await ds.update(updated);

      const logs = await getConnection().collection('updatelogs').find({}).toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].namespace).toBe('dictionaries');
    });
  });
});
