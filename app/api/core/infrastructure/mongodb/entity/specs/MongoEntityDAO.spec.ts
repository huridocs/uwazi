import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoEntityDAO } from '../MongoEntityDAO.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],

  templates: [factory.template('template_1', [])],

  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_1', 'template_1'),
    factory.entity('entity_2', 'template_1', {}, { language: 'en' }),
  ],

  files: [
    // Documents for entity_1
    factory.document('doc1.pdf', {
      entity: 'entity_1',
      originalname: 'document1.pdf',
      language: 'en',
      status: 'ready',
    }),
    factory.document('doc2.pdf', {
      entity: 'entity_1',
      originalname: 'document2.pdf',
      language: 'en',
      status: 'processing',
    }),
    // Attachments for entity_1
    factory.attachment('att1.jpg', {
      entity: 'entity_1',
      originalname: 'attachment1.jpg',
    }),
    factory.attachment('att2.png', {
      entity: 'entity_1',
      originalname: 'attachment2.png',
    }),
    factory.attachment('att3.txt', {
      entity: 'entity_1',
      originalname: 'attachment3.txt',
    }),
    // Files for entity_2 (only documents)
    factory.document('doc3.pdf', {
      entity: 'entity_2',
      originalname: 'document3.pdf',
      language: 'en',
      status: 'ready',
    }),
  ],
};

beforeAll(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const createSut = () => new MongoEntityDAO(getConnection(), TransactionManagerFactory.default());

describe('MongoEntityDAO', () => {
  describe('getWithFile()', () => {
    // eslint-disable-next-line max-statements
    it('should return entity with files separated as documents and attachments', async () => {
      const dao = createSut();
      const result = dao.getWithFiles({ sharedId: 'entity_1', language: 'en' });
      const entities = await result.toArray();
      const entity = entities[0];

      expect(entities).toHaveLength(1);
      expect(entity.sharedId).toBe('entity_1');
      expect((entity as any)?.files).toBe(undefined);
      expect(entity.documents).toHaveLength(2);
      expect(entity.attachments).toHaveLength(3);
      expect(entity.documents.every(d => d.type === 'document')).toBe(true);
      expect(entity.attachments.every(a => a.type === 'attachment')).toBe(true);
    });

    it('should return empty array when no entities match', async () => {
      const dao = createSut();
      const result = dao.getWithFiles({ sharedId: 'non_existent', language: 'en' });
      const entities = await result.toArray();

      expect(entities).toHaveLength(0);
    });
  });
});
