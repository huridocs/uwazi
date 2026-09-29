import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CsvImportRow } from '../../../domain/CsvImportRow.js';
import { CSVImportEntitiesFactories } from '../../factories/CSVImportEntitiesFactories.js';

const ROW_ID = '507f1f77bcf86cd799439011';
const IMPORT_ID = '507f1f77bcf86cd799439012';

describe('MongoCsvImportRowsDataSource identity', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should persist domain id as _id and return it on read', async () => {
    const ds = CSVImportEntitiesFactories.CSVImportRowsDSDefault(
      TransactionManagerFactory.default()
    );
    await ds.insertMany([
      CsvImportRow.create({
        id: ROW_ID,
        importId: IMPORT_ID,
        rowIndex: 0,
        headers: ['title'],
        values: ['A'],
      }),
    ]);

    const stored = await testingEnvironment.db.getCollection('csv_import_rows')!.findOne({
      importId: IMPORT_ID,
    });
    expect(stored?._id.toString()).toBe(ROW_ID);
    expect(stored).not.toHaveProperty('id');

    const loaded = await ds.getByImport(IMPORT_ID);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(ROW_ID);
  });
});
