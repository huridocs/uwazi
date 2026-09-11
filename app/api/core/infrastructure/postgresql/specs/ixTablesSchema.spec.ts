import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const TENANT = 'ix-tenant';
const OTHER_TENANT = 'ix-other-tenant';
const IX_TABLES = ['ix_extractors', 'ix_models', 'ix_suggestions'];

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

const insertExtractor = async (id: string, tenant = TENANT) =>
  pool().query(
    `INSERT INTO ix_extractors ("_id", "tenant_id", "name", "property", "source")
     VALUES ($1, $2, 'extractor', 'prop', '{"property": "source_prop"}')`,
    [id, tenant]
  );

const insertModel = async (id: string, extractorId: string, tenant = TENANT) =>
  pool().query(`INSERT INTO ix_models ("_id", "tenant_id", "extractorId") VALUES ($1, $2, $3)`, [
    id,
    tenant,
    extractorId,
  ]);

type SuggestionInput = {
  id: string;
  extractorId: string;
  entityId?: string;
  language?: string;
  fileId?: string | null;
  tenant?: string;
};

const insertSuggestion = async ({
  id,
  extractorId,
  entityId = 'entity',
  language = 'en',
  fileId = null,
  tenant = TENANT,
}: SuggestionInput) =>
  pool().query(
    `INSERT INTO ix_suggestions
       ("_id", "tenant_id", "extractorId", "entityId", "entityTemplate", "propertyName", "language", "suggestedValue", "fileId")
     VALUES ($1, $2, $3, $4, 'template', 'prop', $5, '""', $6)`,
    [id, tenant, extractorId, entityId, language, fileId]
  );

const idsIn = async (table: string, where = 'TRUE', params: unknown[] = []) => {
  const { rows } = await pool().query(
    `SELECT "_id" FROM ${table} WHERE ${where} ORDER BY "_id"`,
    params
  );
  return rows.map(row => row._id);
};

describe('018-create-ix-tables', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await pool().query('DELETE FROM ix_extractors');
  });

  it.each(IX_TABLES)(
    'should enable row level security with a tenant_isolation policy on %s',
    async table => {
      const { rows: security } = await pool().query(
        'SELECT relrowsecurity FROM pg_class WHERE relname = $1',
        [table]
      );
      const { rows: policies } = await pool().query(
        'SELECT policyname FROM pg_policies WHERE tablename = $1',
        [table]
      );

      expect(security).toEqual([{ relrowsecurity: true }]);
      expect(policies).toEqual([{ policyname: 'tenant_isolation' }]);
    }
  );

  it('should apply the defaults Mongo applied on insert', async () => {
    await insertExtractor('extractor');
    await insertModel('model', 'extractor');
    await insertSuggestion({ id: 'suggestion', extractorId: 'extractor' });

    const { rows: extractors } = await pool().query('SELECT "templates" FROM ix_extractors');
    const { rows: models } = await pool().query(
      'SELECT "status", "findingSuggestions", "creationDate", "processRun" FROM ix_models'
    );
    const { rows: suggestions } = await pool().query(
      'SELECT "status", "useForTraining", "state", "date" FROM ix_suggestions'
    );

    expect(extractors).toEqual([{ templates: [] }]);
    expect(models).toEqual([
      { status: 'processing', findingSuggestions: true, creationDate: null, processRun: null },
    ]);
    expect(suggestions).toEqual([
      { status: 'processing', useForTraining: false, state: null, date: null },
    ]);
  });

  describe('ix_models', () => {
    it('should reject a second model for the same extractor', async () => {
      await insertExtractor('extractor');
      await insertModel('model', 'extractor');

      await expect(insertModel('another model', 'extractor')).rejects.toThrow(
        /ix_models_extractor/
      );
    });

    it('should allow a model for the same extractor id in another tenant', async () => {
      await insertExtractor('extractor');
      await insertExtractor('extractor', OTHER_TENANT);
      await insertModel('model', 'extractor');
      await insertModel('model', 'extractor', OTHER_TENANT);

      expect(await idsIn('ix_models')).toEqual(['model', 'model']);
    });

    it('should reject a model whose extractor does not exist', async () => {
      await expect(insertModel('model', 'missing')).rejects.toThrow(/foreign key constraint/);
    });
  });

  describe('ix_suggestions', () => {
    beforeEach(async () => {
      await insertExtractor('extractor');
    });

    it('should reject a second text suggestion for the same entity and language', async () => {
      await insertSuggestion({ id: 'first', extractorId: 'extractor' });

      await expect(insertSuggestion({ id: 'second', extractorId: 'extractor' })).rejects.toThrow(
        /ix_suggestions_text_key/
      );
    });

    it('should allow pdf suggestions for two files of the same entity and language', async () => {
      await insertSuggestion({ id: 'file 1', extractorId: 'extractor', fileId: 'f1' });
      await insertSuggestion({ id: 'file 2', extractorId: 'extractor', fileId: 'f2' });

      expect(await idsIn('ix_suggestions')).toEqual(['file 1', 'file 2']);
    });

    it('should reject a second pdf suggestion for the same file', async () => {
      await insertSuggestion({ id: 'first', extractorId: 'extractor', fileId: 'f1' });

      await expect(
        insertSuggestion({
          id: 'second',
          extractorId: 'extractor',
          entityId: 'other',
          fileId: 'f1',
        })
      ).rejects.toThrow(/ix_suggestions_pdf_key/);
    });

    it('should keep the text key and the pdf key independent', async () => {
      await insertSuggestion({ id: 'text', extractorId: 'extractor' });
      await insertSuggestion({ id: 'pdf', extractorId: 'extractor', fileId: 'f1' });

      expect(await idsIn('ix_suggestions')).toEqual(['pdf', 'text']);
    });

    it('should reject a suggestion whose extractor does not exist', async () => {
      await expect(insertSuggestion({ id: 'orphan', extractorId: 'missing' })).rejects.toThrow(
        /foreign key constraint/
      );
    });
  });

  it('should delete the model and suggestions of a deleted extractor, and nothing else', async () => {
    await insertExtractor('deleted');
    await insertExtractor('kept');
    await insertModel('deleted model', 'deleted');
    await insertModel('kept model', 'kept');
    await insertSuggestion({ id: 'deleted suggestion', extractorId: 'deleted' });
    await insertSuggestion({ id: 'kept suggestion', extractorId: 'kept' });

    await pool().query(`DELETE FROM ix_extractors WHERE "_id" = 'deleted'`);

    expect(await idsIn('ix_models')).toEqual(['kept model']);
    expect(await idsIn('ix_suggestions')).toEqual(['kept suggestion']);
  });

  it.each(IX_TABLES)(
    'should only show the current tenant rows of %s to the app user',
    async table => {
      await Promise.all(
        [TENANT, OTHER_TENANT].map(async tenant => {
          await insertExtractor(`extractor ${tenant}`, tenant);
          await insertModel(`model ${tenant}`, `extractor ${tenant}`, tenant);
          await insertSuggestion({
            id: `suggestion ${tenant}`,
            extractorId: `extractor ${tenant}`,
            tenant,
          });
        })
      );

      const client = new Client(testingPG.appConfig);
      await client.connect();
      try {
        await client.query("SELECT set_config('app.current_tenant', $1, false)", [TENANT]);
        const { rows } = await client.query(`SELECT "tenant_id" FROM ${table}`);

        expect(rows).toEqual([{ tenant_id: TENANT }]);
      } finally {
        await client.end();
      }
    }
  );
});
