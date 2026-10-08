import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import type { DatavizSnapshotRenderPayload } from '#shared/types/datavizSchema.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  TENANT_ID,
  testConfigs,
  ids,
  payload,
  createdAt,
  fixtures,
  storedSnapshots,
} from './DatavizContractFixtures.js';

const sut = () => testingEnvironment.runWithContext(() => DatavizFactory.snapshotsDataSource());

const newPayload = {
  data: { series: [{ id: 'main' }] },
} as unknown as DatavizSnapshotRenderPayload;

describe('DatavizSnapshotsDataSource', () => {
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

    describe('getByDatavizId()', () => {
      it('should return the snapshot of the dataviz', async () => {
        const result = await sut().getByDatavizId(ids.sales.toHexString());

        expect(result.getDataOrThrow()).toEqual({
          datavizId: ids.sales.toHexString(),
          queryHash: 'sales-hash',
          payload,
          generatedAt: new Date(createdAt),
        });
      });

      it('should fail when the dataviz has no snapshot', async () => {
        const result = await sut().getByDatavizId(ids.manual.toHexString());

        expect(result.isError()).toBe(true);
        expect(() => result.getDataOrThrow()).toThrow(
          `Snapshot not found for dataviz: ${ids.manual.toHexString()}`
        );
      });
    });

    describe('upsert()', () => {
      it('should insert a snapshot for a dataviz without one', async () => {
        const generatedAt = new Date(Date.UTC(2026, 1, 1));

        await sut().upsert({
          datavizId: ids.manual.toHexString(),
          queryHash: 'manual-hash',
          payload: newPayload,
          generatedAt,
        });

        expect(await storedSnapshots(usePostgres)).toEqual(
          [
            {
              _id: ids.sales.toHexString(),
              datavizId: ids.sales.toHexString(),
              queryHash: 'sales-hash',
              payload,
              generatedAt: createdAt,
            },
            {
              _id: ids.manual.toHexString(),
              datavizId: ids.manual.toHexString(),
              queryHash: 'manual-hash',
              payload: newPayload,
              generatedAt: generatedAt.getTime(),
            },
          ].sort((a, b) => a.datavizId.localeCompare(b.datavizId))
        );
      });

      it('should replace the existing snapshot of the dataviz', async () => {
        const generatedAt = new Date(Date.UTC(2026, 1, 1));

        await sut().upsert({
          datavizId: ids.sales.toHexString(),
          queryHash: 'new-hash',
          payload: newPayload,
          generatedAt,
        });

        expect(await storedSnapshots(usePostgres)).toEqual([
          {
            _id: ids.sales.toHexString(),
            datavizId: ids.sales.toHexString(),
            queryHash: 'new-hash',
            payload: newPayload,
            generatedAt: generatedAt.getTime(),
          },
        ]);
      });
    });

    describe('deleteByDatavizId()', () => {
      it('should remove the snapshot of the dataviz', async () => {
        await sut().deleteByDatavizId(ids.sales.toHexString());

        expect(await storedSnapshots(usePostgres)).toEqual([]);
      });
    });
  });
});
