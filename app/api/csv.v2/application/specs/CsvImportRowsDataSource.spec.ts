import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';
import { CSVImportEntitiesFactories } from '../../infrastructure/factories/CSVImportEntitiesFactories.js';
import { applyCsvBackendFlags, csvBackendConfigs } from '../../specs/csvBackendTest.js';

const ROW_A = '507f1f77bcf86cd799439011';
const ROW_B = '507f1f77bcf86cd799439012';
const IMPORT_ID = '507f1f77bcf86cd799439013';

const aRow = (overrides: Partial<{ id: string; rowIndex: number; values: string[] }> = {}) =>
  CsvImportRow.create({
    id: overrides.id ?? ROW_A,
    importId: IMPORT_ID,
    rowIndex: overrides.rowIndex ?? 1,
    headers: ['title'],
    values: overrides.values ?? ['B'],
  });

const storedIds = async (postgresCsv: boolean) => {
  if (postgresCsv) {
    const { rows } = await testingPG.pool!.query(
      `SELECT "_id" FROM csv_import_rows WHERE "import_id" = $1 ORDER BY "row_index"`,
      [IMPORT_ID]
    );
    return rows.map(row => row._id);
  }

  const docs = await testingEnvironment.db
    .getCollection('csv_import_rows')!
    .find({ importId: IMPORT_ID })
    .sort({ rowIndex: 1 })
    .toArray();
  return docs.map(doc => doc._id.toString());
};

describe('CsvImportRowsDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(csvBackendConfigs)('$name', ({ postgresCsv }) => {
    beforeEach(async () => {
      await testingEnvironment.setUp({}, { postgres: true });
      applyCsvBackendFlags(postgresCsv);
      if (postgresCsv) {
        await testingPG.clear(['csv_import_rows']);
      }
    });

    const sut = () =>
      testingEnvironment.runWithContext(() =>
        CSVImportEntitiesFactories.CSVImportRowsDSDefault(TransactionManagerFactory.default())
      );

    it('should persist domain id as _id in the selected store and return rows ordered by rowIndex', async () => {
      const ds = sut();
      await ds.insertMany([
        aRow({ id: ROW_B, rowIndex: 1, values: ['B'] }),
        aRow({ id: ROW_A, rowIndex: 0, values: ['A'] }),
      ]);

      expect(await storedIds(postgresCsv)).toEqual([ROW_A, ROW_B]);

      const loaded = await ds.getByImport(IMPORT_ID);
      expect(loaded.map(row => row.toObject())).toEqual([
        aRow({ id: ROW_A, rowIndex: 0, values: ['A'] }).toObject(),
        aRow({ id: ROW_B, rowIndex: 1, values: ['B'] }).toObject(),
      ]);
    });

    it('should count, page, filter by indexes, and delete by import', async () => {
      const ds = sut();
      await ds.insertMany([
        aRow({ id: ROW_A, rowIndex: 0, values: ['A'] }),
        aRow({ id: ROW_B, rowIndex: 1, values: ['B'] }),
      ]);

      expect(await ds.countByImport(IMPORT_ID)).toBe(2);
      expect((await ds.getByImport(IMPORT_ID, 1, 1)).map(row => row.id)).toEqual([ROW_B]);
      expect((await ds.getByImportAndIndexes(IMPORT_ID, [0])).map(row => row.id)).toEqual([ROW_A]);
      expect(await ds.getByImportAndIndexes(IMPORT_ID, [])).toEqual([]);

      await ds.deleteByImport(IMPORT_ID);
      expect(await ds.countByImport(IMPORT_ID)).toBe(0);
      expect(await storedIds(postgresCsv)).toEqual([]);
    });
  });
});
