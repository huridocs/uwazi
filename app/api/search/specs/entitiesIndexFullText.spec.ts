import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import db from '#api/utils/testing_db.js';
import { FileType } from '#shared/types/fileType.js';
import { EntityWithFilesSchema } from '#shared/types/entityType.js';

describe('entitiesIndex fullText', () => {
  const elasticIndex = 'index_for_entities_fulltext_testing';

  beforeEach(async () => {
    await testingEnvironment.setUp({}, elasticIndex);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('does not keep attachment fullText in the indexed entity body', async () => {
    const entities = [{ sharedId: 'ent1', title: 'ent1', language: 'en' }];
    const files: FileType[] = [
      {
        entity: 'ent1',
        originalname: 'doc',
        filename: 'doc',
        type: 'document',
        mimetype: 'application/pdf',
        language: 'eng',
        fullText: { 1: 'document text' },
        totalPages: 0,
      },
      {
        entity: 'ent1',
        originalname: 'att',
        filename: 'att',
        type: 'attachment',
        mimetype: 'application/pdf',
        language: 'eng',
        fullText: { 1: 'attachment text' },
        totalPages: 0,
      },
    ];

    await db.setupFixturesAndContext({ entities, files });
    await elasticTesting.reindex();

    const [indexedEntity] = (await elasticTesting.getIndexedEntities()) as EntityWithFilesSchema[];
    expect(indexedEntity.attachments).toHaveLength(1);
    expect(indexedEntity.attachments![0].fullText).toBeUndefined();
  });

  it('indexes only the default document fullText', async () => {
    const entities = [{ sharedId: 'ent2', title: 'ent2', language: 'en' }];
    const files: FileType[] = [
      {
        entity: 'ent2',
        originalname: 'primary',
        filename: 'primary',
        type: 'document',
        mimetype: 'application/pdf',
        language: 'ukr',
        fullText: { 1: 'default text' },
        totalPages: 0,
      },
      {
        entity: 'ent2',
        originalname: 'failed',
        filename: 'failed',
        type: 'document',
        mimetype: 'application/pdf',
        language: 'eng',
        status: 'failed',
        fullText: { 1: 'ignored text' },
        totalPages: 0,
      },
    ];

    await db.setupFixturesAndContext({ entities, files });
    await elasticTesting.reindex();

    const [fullTextChild] = await elasticTesting.getIndexedFullTextFromFiles();
    expect(fullTextChild.fullText_other).toBe('default text');

    const [indexedEntity] = (await elasticTesting.getIndexedEntities()) as EntityWithFilesSchema[];
    indexedEntity.documents?.forEach(document => {
      expect(document.fullText).toBeUndefined();
    });
  });
});
