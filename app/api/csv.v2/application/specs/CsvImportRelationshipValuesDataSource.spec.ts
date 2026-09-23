import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { CsvImportRelationshipValues } from '../../domain/CsvImportRelationshipValues.js';
import { CSVImportEntitiesFactories } from '../../infrastructure/factories/CSVImportEntitiesFactories.js';
import { applyCsvBackendFlags, csvBackendConfigs } from '../../specs/csvBackendTest.js';

const DOC_A = '507f1f77bcf86cd799439051';
const DOC_B = '507f1f77bcf86cd799439052';
const IMPORT_ID = '507f1f77bcf86cd799439053';
const TEMPLATE_A = '507f1f77bcf86cd799439054';
const TEMPLATE_B = '507f1f77bcf86cd799439055';

const aValues = (overrides: { id: string; templateId: string }) =>
  CsvImportRelationshipValues.create({
    id: overrides.id,
    importId: IMPORT_ID,
    templateId: overrides.templateId,
    values: [{ label: 'Target', matches: [{ sharedId: 's1', templateId: overrides.templateId }] }],
    createdAt: 100,
  });

const storedIds = async (postgresCsv: boolean) => {
  if (postgresCsv) {
    const { rows } = await testingPG.pool!.query(
      `SELECT "_id" FROM csv_import_relationships_values WHERE "import_id" = $1 ORDER BY "template_id"`,
      [IMPORT_ID]
    );
    return rows.map(row => row._id);
  }

  const docs = await testingEnvironment.db
    .getCollection('csv_import_relationships_values')!
    .find({ importId: IMPORT_ID })
    .sort({ templateId: 1 })
    .toArray();
  return docs.map(doc => doc._id.toString());
};

describe('CsvImportRelationshipValuesDataSource', () => {
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
        await testingPG.clear(['csv_import_relationships_values']);
      }
    });

    const sut = () =>
      testingEnvironment.runWithContext(() =>
        CSVImportEntitiesFactories.CSVImportRelationshipValuesDSDefault(
          TransactionManagerFactory.default()
        )
      );

    it('should replace values in the selected store', async () => {
      const ds = sut();
      await ds.replaceValues(IMPORT_ID, [
        aValues({ id: DOC_A, templateId: TEMPLATE_A }),
        aValues({ id: DOC_B, templateId: TEMPLATE_B }),
      ]);
      expect(await storedIds(postgresCsv)).toEqual([DOC_A, DOC_B]);

      await ds.replaceValues(IMPORT_ID, [aValues({ id: DOC_B, templateId: TEMPLATE_B })]);
      expect(await storedIds(postgresCsv)).toEqual([DOC_B]);
      expect((await ds.getByImport(IMPORT_ID)).map(doc => doc.id)).toEqual([DOC_B]);
    });
  });
});
