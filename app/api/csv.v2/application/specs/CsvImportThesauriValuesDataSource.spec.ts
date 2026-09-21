import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { CsvImportThesauriValues } from '../../domain/CsvImportThesauriValues.js';
import { CSVImportEntitiesFactories } from '../../infrastructure/factories/CSVImportEntitiesFactories.js';
import { applyCsvBackendFlags, csvBackendConfigs } from '../../specs/csvBackendTest.js';

const DOC_A = '507f1f77bcf86cd799439031';
const DOC_B = '507f1f77bcf86cd799439032';
const IMPORT_ID = '507f1f77bcf86cd799439033';
const THESAURUS_A = '507f1f77bcf86cd799439034';
const THESAURUS_B = '507f1f77bcf86cd799439035';

const aPending = (overrides: { id: string; thesaurusId: string }) =>
  CsvImportThesauriValues.create({
    id: overrides.id,
    importId: IMPORT_ID,
    thesaurusId: overrides.thesaurusId,
    entries: [],
    createdAt: 100,
  });

const storedIds = async (postgresCsv: boolean) => {
  if (postgresCsv) {
    const { rows } = await testingPG.pool!.query(
      `SELECT "_id" FROM csv_import_thesauri_values WHERE "import_id" = $1 ORDER BY "thesaurus_id"`,
      [IMPORT_ID]
    );
    return rows.map(row => row._id);
  }

  const docs = await testingEnvironment.db
    .getCollection('csv_import_thesauri_values')!
    .find({ importId: IMPORT_ID })
    .sort({ thesaurusId: 1 })
    .toArray();
  return docs.map(doc => doc._id.toString());
};

describe('CsvImportThesauriValuesDataSource', () => {
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
        await testingPG.clear(['csv_import_thesauri_values']);
      }
    });

    const sut = () =>
      testingEnvironment.runWithContext(() =>
        CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(
          TransactionManagerFactory.default()
        )
      );

    it('should replace pending values in the selected store', async () => {
      const ds = sut();
      await ds.replacePendingValues(IMPORT_ID, [
        aPending({ id: DOC_A, thesaurusId: THESAURUS_A }),
        aPending({ id: DOC_B, thesaurusId: THESAURUS_B }),
      ]);
      expect(await storedIds(postgresCsv)).toEqual([DOC_A, DOC_B]);

      await ds.replacePendingValues(IMPORT_ID, [aPending({ id: DOC_B, thesaurusId: THESAURUS_B })]);
      expect(await storedIds(postgresCsv)).toEqual([DOC_B]);
      expect((await ds.getByImport(IMPORT_ID)).map(doc => doc.id)).toEqual([DOC_B]);
    });

    it('should mark applied values and delete by import', async () => {
      const ds = sut();
      await ds.replacePendingValues(IMPORT_ID, [aPending({ id: DOC_A, thesaurusId: THESAURUS_A })]);
      await ds.markAsApplied({
        importId: IMPORT_ID,
        thesaurusId: THESAURUS_A,
        appliedAt: 200,
        appliedValues: [{ label: 'City', valueId: 'v1' }],
        stats: { valuesObserved: 1, valuesCreated: 1 },
      });

      const [loaded] = await ds.getByImport(IMPORT_ID);
      expect(loaded.appliedAt).toBe(200);
      expect(loaded.appliedValues).toEqual([{ label: 'City', valueId: 'v1' }]);
      expect(loaded.stats).toEqual({ valuesObserved: 1, valuesCreated: 1 });

      await ds.deleteByImport(IMPORT_ID);
      expect(await storedIds(postgresCsv)).toEqual([]);
    });
  });
});
