import { ObjectId } from 'mongodb';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { DeleteFileUseCaseFactory } from '#api/core/infrastructure/factories/DeleteFileUseCaseFactory.js';

const f = getFixturesFactory();

const baseFixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template1')],
};

const createSUT = () => {
  const actor = User.createFrom({
    _id: new ObjectId(),
    role: 'admin',
    groups: [],
    email: 'admin@test.com',
    username: 'adminUser',
  });

  const tenant = { name: 'tenant' } as any;

  const { sut, eventEmitter } = testingEnvironment.runWithContext(
    () => ({
      sut: DeleteFileUseCaseFactory.default({
        filesService: FilesServiceFactory.default({
          pathManager: TestUtils.mockClass<PathManager>({ createPath: jest.fn() }),
        }),
      }),
      eventEmitter: ExecutionContext.eventEmitter,
    }),
    { actor, tenant, instances: { jobsDispatcher: TestUtils.mockClass<JobsDispatcher>({}) } }
  );

  return { sut, eventEmitter };
};

describe('FileDelete - setPreview (real DB)', () => {
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when thumbnails remain after deleting a document', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp({
        ...baseFixtures,
        entities: [
          f.entity('entity1', 'template1', {}, { language: 'en', preview: 'old.jpg' }),
          f.entity('entity1', 'template1', {}, { language: 'es', preview: 'old.jpg' }),
        ],
        files: [
          f.file('doc1', {
            type: 'document',
            status: 'ready',
            entity: 'entity1',
            language: 'en',
            mimetype: 'application/pdf',
          }),
          f.file('doc1-thumb', {
            type: 'thumbnail',
            entity: 'entity1',
            language: 'en',
            filename: `${f.idString('doc1')}.jpg`,
            mimetype: 'image/jpeg',
          }),
          f.file('doc2', {
            type: 'document',
            status: 'ready',
            entity: 'entity1',
            language: 'es',
            mimetype: 'application/pdf',
          }),
          f.file('doc2-thumb', {
            type: 'thumbnail',
            entity: 'entity1',
            language: 'es',
            filename: `${f.idString('doc2')}.jpg`,
            mimetype: 'image/jpeg',
          }),
        ],
      });
    });

    it('should recalculate preview from the surviving thumbnail', async () => {
      // delete doc1 (en) — doc2 (es) and its thumbnail survive
      const { sut, eventEmitter } = createSUT();
      await sut.execute({ fileId: f.idString('doc1') });

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(en?.preview).toBe(`${f.idString('doc2')}.jpg`);
      expect(es?.preview).toBe(`${f.idString('doc2')}.jpg`);

      expect(eventEmitter.emit).toHaveBeenCalledWith(expect.any(EntityUpdatedEvent));
    });
  });

  describe('when no thumbnails remain after deleting the last document', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp({
        ...baseFixtures,
        entities: [
          f.entity('entity1', 'template1', {}, { language: 'en', preview: 'stale.jpg' }),
          f.entity('entity1', 'template1', {}, { language: 'es', preview: 'stale.jpg' }),
        ],
        files: [
          f.file('doc1', {
            type: 'document',
            status: 'ready',
            entity: 'entity1',
            language: 'en',
            mimetype: 'application/pdf',
          }),
        ],
      });
    });

    it('should clear preview from all entity translations', async () => {
      const { sut } = createSUT();
      await sut.execute({ fileId: f.idString('doc1') });

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(en?.preview).toBeUndefined();
      expect(es?.preview).toBeUndefined();
    });
  });
});
