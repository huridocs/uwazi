import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { CsvImportRelationshipPendingValues } from '../../domain/CsvImportRelationshipPendingValues.js';
import { CSVImportEntitiesFactories } from '../../infrastructure/factories/CSVImportEntitiesFactories.js';
import { applyCsvBackendFlags, csvBackendConfigs } from '../../specs/csvBackendTest.js';

const DOC_A = '507f1f77bcf86cd799439041';
const DOC_B = '507f1f77bcf86cd799439042';
const IMPORT_ID = '507f1f77bcf86cd799439043';
const TEMPLATE_A = '507f1f77bcf86cd799439044';
const TEMPLATE_B = '507f1f77bcf86cd799439045';

const aPending = (overrides: { id: string; templateId: string }) =>
  CsvImportRelationshipPendingValues.create({
    id: overrides.id,
    importId: IMPORT_ID,
    templateId: overrides.templateId,
    titles: ['New Entity'],
    createdAt: 100,
  });

const storedIds = async (postgresCsv: boolean) => {
  if (postgresCsv) {
    const { rows } = await testingPG.pool!.query(
      `SELECT "_id" FROM csv_import_relationships_pending_values WHERE "import_id" = $1 ORDER BY "template_id"`,
      [IMPORT_ID]
    );
    return rows.map(row => row._id);
  }

  const docs = await testingEnvironment.db
    .getCollection('csv_import_relationships_pending_values')!
    .find({ importId: IMPORT_ID })
    .sort({ templateId: 1 })
    .toArray();
  return docs.map(doc => doc._id.toString());
};

describe('CsvImportRelationshipPendingValuesDataSource', () => {
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
        await testingPG.clear(['csv_import_relationships_pending_values']);
      }
    });

    const sut = () =>
      testingEnvironment.runWithContext(() =>
        CSVImportEntitiesFactories.CSVImportRelationshipPendingValuesDSDefault(
          TransactionManagerFactory.default()
        )
      );

    it('should replace pending values in the selected store', async () => {
      const ds = sut();
      await ds.replacePendingValues(IMPORT_ID, [
        aPending({ id: DOC_A, templateId: TEMPLATE_A }),
        aPending({ id: DOC_B, templateId: TEMPLATE_B }),
      ]);
      expect(await storedIds(postgresCsv)).toEqual([DOC_A, DOC_B]);

      await ds.replacePendingValues(IMPORT_ID, [aPending({ id: DOC_B, templateId: TEMPLATE_B })]);
      expect(await storedIds(postgresCsv)).toEqual([DOC_B]);
      expect((await ds.getByImport(IMPORT_ID)).map(doc => doc.id)).toEqual([DOC_B]);
    });
  });
});
