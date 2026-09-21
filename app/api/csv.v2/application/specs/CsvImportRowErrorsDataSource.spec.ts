import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { CsvImportRowError, RowErrorCode } from '../../domain/CsvImportRowError.js';
import { CSVImportEntitiesFactories } from '../../infrastructure/factories/CSVImportEntitiesFactories.js';
import { applyCsvBackendFlags, csvBackendConfigs } from '../../specs/csvBackendTest.js';

const ERROR_A = '507f1f77bcf86cd799439021';
const ERROR_B = '507f1f77bcf86cd799439022';
const IMPORT_ID = '507f1f77bcf86cd799439023';

const anError = (overrides: Partial<{ id: string; rowIndex: number }> = {}) =>
  CsvImportRowError.create({
    id: overrides.id ?? ERROR_A,
    importId: IMPORT_ID,
    rowIndex: overrides.rowIndex ?? 0,
    message: 'required',
    code: RowErrorCode.ValueRequired,
    property: 'title',
    rawValue: '',
    createdAt: 100,
  });

const storedIds = async (postgresCsv: boolean) => {
  if (postgresCsv) {
    const { rows } = await testingPG.pool!.query(
      `SELECT "_id" FROM csv_import_row_errors WHERE "import_id" = $1 ORDER BY "row_index", "_id"`,
      [IMPORT_ID]
    );
    return rows.map(row => row._id);
  }

  const docs = await testingEnvironment.db
    .getCollection('csv_import_row_errors')!
    .find({ importId: IMPORT_ID })
    .sort({ rowIndex: 1, _id: 1 })
    .toArray();
  return docs.map(doc => doc._id.toString());
};

describe('CsvImportRowErrorsDataSource', () => {
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
        await testingPG.clear(['csv_import_row_errors']);
      }
    });

    const sut = () =>
      testingEnvironment.runWithContext(() =>
        CSVImportEntitiesFactories.CSVImportRowErrorsDSDefault(TransactionManagerFactory.default())
      );

    it('should persist domain id as _id in the selected store and return errors ordered by rowIndex', async () => {
      const ds = sut();
      await ds.insertMany([
        anError({ id: ERROR_B, rowIndex: 1 }),
        anError({ id: ERROR_A, rowIndex: 0 }),
      ]);

      expect(await storedIds(postgresCsv)).toEqual([ERROR_A, ERROR_B]);
      expect((await ds.getByImport(IMPORT_ID)).map(error => error.id)).toEqual([ERROR_A, ERROR_B]);
      expect((await ds.getByImport(IMPORT_ID)).map(error => error.rowIndex)).toEqual([0, 1]);
    });

    it('should count and delete by import', async () => {
      const ds = sut();
      await ds.insertMany([anError({ id: ERROR_A }), anError({ id: ERROR_B, rowIndex: 0 })]);

      expect(await ds.countByImport(IMPORT_ID)).toBe(2);
      await ds.deleteByImport(IMPORT_ID);
      expect(await ds.countByImport(IMPORT_ID)).toBe(0);
      expect(await storedIds(postgresCsv)).toEqual([]);
    });
  });
});
