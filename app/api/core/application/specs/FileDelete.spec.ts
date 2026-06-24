import { ObjectId } from 'mongodb';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { DeleteFileUseCaseFactory } from '#api/core/infrastructure/factories/DeleteFileUseCaseFactory.js';

const f = getFixturesFactory();

const allFixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template1')],
  entities: [
    f.entity('entity1', 'template1', {}, { language: 'en', preview: 'old.jpg' }),
    f.entity('entity1', 'template1', {}, { language: 'es', preview: 'old.jpg' }),
    f.entity('entity2', 'template1', {}, { language: 'en', preview: 'stale.jpg' }),
    f.entity('entity2', 'template1', {}, { language: 'es', preview: 'stale.jpg' }),
  ],
  files: [
    f.file('doc1', {
      type: 'document',
      status: 'ready',
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
      size: 0,
      creationDate: 0,
    }),
    f.file('doc1-thumb', {
      type: 'thumbnail',
      entity: 'entity1',
      language: 'en',
      filename: `${f.idString('doc1')}.jpg`,
      mimetype: 'image/jpeg',
      size: 0,
      creationDate: 0,
    }),
    f.file('doc2', {
      type: 'document',
      status: 'ready',
      entity: 'entity1',
      language: 'es',
      mimetype: 'application/pdf',
      size: 0,
      creationDate: 0,
    }),
    f.file('doc2-thumb', {
      type: 'thumbnail',
      entity: 'entity1',
      language: 'es',
      filename: `${f.idString('doc2')}.jpg`,
      mimetype: 'image/jpeg',
      size: 0,
      creationDate: 0,
    }),
    f.file('lonely-doc', {
      type: 'document',
      status: 'ready',
      entity: 'entity2',
      language: 'en',
      mimetype: 'application/pdf',
      size: 0,
      creationDate: 0,
    }),
  ],
};

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('FileDelete - setPreview (real DB)', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: 'tenant',
        featureFlags: { postgresFiles: usePostgres },
      });

      await testingEnvironment.setFixtures(allFixtures);

      if (usePostgres) {
        await testingPG.clear(['files']);
        await testingPG.setFixtures({
          files: allFixtures.files!.map(file => ({ ...file, _id: file._id?.toString() })),
        });
      }
    });

    const createSut = () => {
      const actor = User.createFrom({
        _id: new ObjectId(),
        role: 'admin',
        groups: [],
        email: 'admin@test.com',
        username: 'adminUser',
      });

      const { sut, eventEmitter } = testingEnvironment.runWithContext(
        () => ({
          sut: DeleteFileUseCaseFactory.default({
            filesService: FilesServiceFactory.default({
              pathManager: TestUtils.mockClass<PathManager>({ createPath: jest.fn() }),
            }),
          }),
          eventEmitter: ExecutionContext.eventEmitter,
        }),
        { actor, instances: { jobsDispatcher: TestUtils.mockClass<JobsDispatcher>({}) } }
      );

      return { sut, eventEmitter };
    };

    it('should recalculate preview from the surviving thumbnail', async () => {
      const { sut, eventEmitter } = createSut();
      await sut.execute({ fileId: f.idString('doc1') });

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(en?.preview).toBe(`${f.idString('doc2')}.jpg`);
      expect(es?.preview).toBe(`${f.idString('doc2')}.jpg`);

      expect(eventEmitter.emit).toHaveBeenCalledWith(expect.any(EntityUpdatedEvent));
    });

    it('should clear preview from all entity translations', async () => {
      const { sut } = createSut();
      await sut.execute({ fileId: f.idString('lonely-doc') });

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity2' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity2' && e.language === 'es');

      expect(en?.preview).toBeUndefined();
      expect(es?.preview).toBeUndefined();
    });
  });
});
