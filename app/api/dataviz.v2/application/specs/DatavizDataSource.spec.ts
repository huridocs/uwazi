import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { DatavizDuplicateNameError, DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  TENANT_ID,
  testConfigs,
  ids,
  query,
  chart,
  appearance,
  refresh,
  createdAt,
  fixtures,
  definitions,
  storedDataviz,
} from './DatavizContractFixtures.js';

const sut = () => testingEnvironment.runWithContext(() => DatavizFactory.dataSource());

const newDataviz = (overrides: Partial<Parameters<typeof Dataviz.fromPersistence>[0]> = {}) =>
  Dataviz.fromPersistence({
    id: '6650a0000000000000000001',
    name: 'New chart',
    query,
    chart,
    appearance,
    refresh,
    createdAt: new Date(createdAt).toISOString(),
    ...overrides,
  });

describe('DatavizDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });
      await testingEnvironment.setFixtures(fixtures);
    });

    describe('getById()', () => {
      it('should return the dataviz', async () => {
        const result = await sut().getById(ids.sales.toHexString());

        expect(result.getDataOrThrow().toDefinition()).toEqual(definitions.sales);
      });

      it('should fill the defaults of a dataviz stored without optional fields', async () => {
        const result = await sut().getById(ids.manual.toHexString());

        expect(result.getDataOrThrow().toDefinition()).toEqual(definitions.manual);
      });

      it('should fail with DatavizNotFoundError for a missing id', async () => {
        const result = await sut().getById(ids.missing);

        expect(result.isError()).toBe(true);
        expect(() => result.getDataOrThrow()).toThrow(DatavizNotFoundError);
      });
    });

    describe('list()', () => {
      it('should return every dataviz ordered by name', async () => {
        const list = await sut().list();

        expect(list.map(dataviz => dataviz.toDefinition())).toEqual([
          definitions.manual,
          definitions.sales,
        ]);
      });
    });

    describe('existsByName()', () => {
      it('should report whether a dataviz with that name exists', async () => {
        await expect(sut().existsByName('Sales')).resolves.toBe(true);
        await expect(sut().existsByName('Unknown')).resolves.toBe(false);
      });
    });

    describe('create()', () => {
      it('should store the dataviz', async () => {
        await sut().create(newDataviz({ embedPublic: true }));

        const stored = await storedDataviz(usePostgres);
        expect(stored.map(row => row.name)).toEqual(['Manual', 'New chart', 'Sales']);
        expect(stored[1]).toMatchObject({
          _id: '6650a0000000000000000001',
          refresh,
          embedPublic: true,
          createdAt,
        });
      });
    });

    describe('update()', () => {
      it('should replace the stored dataviz, clearing removed optional fields', async () => {
        const updated = newDataviz({
          id: ids.sales.toHexString(),
          name: 'Sales renamed',
          refresh: { refreshMode: 'live' },
        });

        await sut().update(updated);

        const result = await sut().getById(ids.sales.toHexString());
        expect(result.getDataOrThrow().toDefinition()).toMatchObject({
          name: 'Sales renamed',
          description: undefined,
          processing: undefined,
          embedPublic: false,
          refresh: { refreshMode: 'live' },
        });
      });
    });

    describe('delete()', () => {
      it('should remove only that dataviz', async () => {
        await sut().delete(ids.sales.toHexString());

        expect((await storedDataviz(usePostgres)).map(row => row.name)).toEqual(['Manual']);
      });
    });

    describe('setProcessing()', () => {
      it('should change only processing and updatedAt', async () => {
        const before = await storedDataviz(usePostgres);

        await sut().setProcessing(ids.sales.toHexString(), {
          active: true,
          startedAt: '2026-02-01T00:00:00.000Z',
        });

        const after = await storedDataviz(usePostgres);
        expect(after[1]).toEqual({
          ...before[1],
          processing: { active: true, startedAt: '2026-02-01T00:00:00.000Z' },
          updatedAt: expect.any(Number),
        });
        expect(after[1].updatedAt).toBeGreaterThan(before[1].updatedAt);
        expect(after[0]).toEqual(before[0]);
      });
    });
  });

  // The use cases check names before writing; the unique constraint is the last word when two
  // writes race past that check. Mongo has no equivalent guarantee in this suite.
  describe('Postgres unique name constraint', () => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ name: TENANT_ID, featureFlags: { postgresCore: true } });
      await testingEnvironment.setFixtures(fixtures);
    });

    it('should reject creating a duplicated name', async () => {
      await expect(sut().create(newDataviz({ name: 'Sales' }))).rejects.toThrow(
        DatavizDuplicateNameError
      );
    });

    it('should reject renaming onto another dataviz name', async () => {
      const updated = newDataviz({ id: ids.sales.toHexString(), name: 'Manual' });

      await expect(sut().update(updated)).rejects.toThrow(DatavizDuplicateNameError);
    });
  });
});
