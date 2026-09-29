import { ObjectId } from 'mongodb';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { CsvImportDoesNotExistError } from '../../domain/csvImporErrors.js';
import { CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport.js';
import { CSVImportEntitiesFactories } from '../../infrastructure/factories/CSVImportEntitiesFactories.js';
import { applyCsvBackendFlags, csvBackendConfigs } from '../../specs/csvBackendTest.js';

const IMPORT_A = '507f1f77bcf86cd799439061';
const IMPORT_B = '507f1f77bcf86cd799439062';

const anImport = (id: string, createdAt: number) =>
  CsvImportDomain.from({
    id,
    templateId: 'template',
    file: { originalName: 'a.csv', mimeType: 'text/csv', size: 1 },
    status: CsvImportStatus.Queued,
    createdBy: 'user',
    createdAt,
    updatedAt: createdAt,
  });

const storedStatus = async (id: string, postgresCsv: boolean) => {
  if (postgresCsv) {
    const { rows } = await testingPG.pool!.query(
      `SELECT "status" FROM csv_imports WHERE "_id" = $1`,
      [id]
    );
    return rows[0]?.status;
  }
  const doc = await testingEnvironment.db.getCollection('csv_imports')!.findOne({
    _id: new ObjectId(id),
  });
  return doc?.status;
};

describe('CsvImportsDataSource', () => {
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
        await testingPG.clear(['csv_imports']);
      }
    });

    const sut = () =>
      testingEnvironment.runWithContext(() =>
        CSVImportEntitiesFactories.CSVImportDSDefault(TransactionManagerFactory.default())
      );

    it('should persist domain id as _id in the selected store and list newest first', async () => {
      const ds = sut();
      await ds.insert(anImport(IMPORT_A, 1));
      await ds.insert(anImport(IMPORT_B, 2));

      expect(await storedStatus(IMPORT_A, postgresCsv)).toBe(CsvImportStatus.Queued);
      expect((await ds.getAll()).map(doc => doc.id)).toEqual([IMPORT_B, IMPORT_A]);
      expect((await ds.getById(IMPORT_A)).getDataOrThrow().id).toBe(IMPORT_A);
      expect((await ds.getById('507f1f77bcf86cd799439099')).getError()).toBeInstanceOf(
        CsvImportDoesNotExistError
      );
    });

    const seedCancelCases = async (ds: ReturnType<typeof sut>) => {
      const active = CsvImportDomain.withStatus(
        anImport(IMPORT_A, 1),
        CsvImportStatus.ImportEntities
      );
      const done = CsvImportDomain.withStatus(anImport(IMPORT_B, 2), CsvImportStatus.Completed);
      await ds.insert(active);
      await ds.insert(done);
      return { active, done };
    };

    it('should cancel non-terminal imports and keep cancelled status on update', async () => {
      const ds = sut();
      const { active } = await seedCancelCases(ds);

      await ds.cancel(IMPORT_A);
      await ds.cancel(IMPORT_B);

      expect(await storedStatus(IMPORT_A, postgresCsv)).toBe(CsvImportStatus.Cancelled);
      expect(await storedStatus(IMPORT_B, postgresCsv)).toBe(CsvImportStatus.Completed);
      expect(await ds.isCancelled(IMPORT_A)).toBe(true);
      expect(await ds.isCancelled(IMPORT_B)).toBe(false);

      await ds.update(CsvImportDomain.withStatus(active, CsvImportStatus.ImportEntitiesDone));
      expect(await storedStatus(IMPORT_A, postgresCsv)).toBe(CsvImportStatus.Cancelled);
    });
  });
});
