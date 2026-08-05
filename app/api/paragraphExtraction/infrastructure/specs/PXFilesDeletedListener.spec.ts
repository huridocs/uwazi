import { ObjectId } from 'mongodb';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FileType } from '#shared/types/fileType.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { tenants } from '#api/tenants/index.js';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource.js';
import { MongoExtractorBuilder } from './MongoPXExtractorBuilder.js';
import { mongoPXExtractorsCollection } from '../MongoPXExtractorsDataSource.js';
import { MongoPXEntityStatusDBO } from '../MongoPXEntityStatusDBO.js';
import { PXFilesDeletedListener } from '../PXFilesDeletedListener.js';

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const { extractor, sourceTemplate, targetTemplate, targetRelationship, sourceRelationship } =
  MongoExtractorBuilder.create().build();

const { factory } = MongoExtractorBuilder;

const entity = factory.entity('entity', sourceTemplate.name);

const mongoEntityStatus: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status'),
  entitySharedId: entity.sharedId!,
  extractorId: extractor._id,
  status: EntityStatus.Processed,
};

const documentPt = factory.document('document_1', {
  language: 'pt',
  entity: entity.sharedId,
  creationDate: 1,
  status: 'ready',
  mimetype: 'application/pdf',
});

const documentEn = factory.document('document_2', {
  language: 'en',
  entity: entity.sharedId,
  creationDate: 2,
  status: 'ready',
  mimetype: 'application/pdf',
});

const documentEs = factory.document('invalid_document', {
  language: 'es',
  entity: entity.sharedId,
  creationDate: 3,
  status: 'ready',
  mimetype: 'application/pdf',
});

const customFile = factory.custom_upload('invalid_custom_file', {
  entity: entity.sharedId,
  creationDate: 4,
  status: 'ready',
  mimetype: 'text/plain',
  size: 0,
});

const createFixtures = (): DBFixture => ({
  entities: [entity],
  templates: [targetTemplate, sourceTemplate],
  [mongoPXExtractorsCollection]: [extractor],
  [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
  relationtypes: [sourceRelationship, targetRelationship],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],
});

describe('PXFilesDeletedListener', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures(), { postgres: true });
  });

  afterAll(async () => {
    tenants.current().featureFlags!.paragraphExtraction = false;
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresFiles: usePostgres },
      });
      await testingEnvironment.setFixtures(createFixtures());
      tenants.current().featureFlags!.paragraphExtraction = true;
    });

    it('should mark EntityStatus as obsolete', async () => {
      await testingEnvironment.setFixtures({ ...createFixtures(), files: [documentEn] });
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [documentPt];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toMatchObject([
        {
          status: EntityStatus.Obsolete,
        },
      ]);
    });

    it('should mark EntityStatus as processing_obsolete if there is a processing going on', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        files: [documentEn],
        [mongoPXEntitiesStatusCollection]: [
          { ...mongoEntityStatus, status: EntityStatus.Processing },
        ],
      });
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [documentPt];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toMatchObject([
        {
          status: EntityStatus.ProcessingObsolete,
        },
      ]);
    });

    it('should do nothing if feature flag not enabled', async () => {
      await testingEnvironment.setFixtures({ ...createFixtures(), files: [documentEn] });
      tenants.current().featureFlags!.paragraphExtraction = false;
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [documentPt];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toMatchObject([
        {
          status: EntityStatus.Processed,
        },
      ]);
    });

    it('should keep EntityStatus as new', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        files: [documentEn],
        [mongoPXEntitiesStatusCollection]: [{ ...mongoEntityStatus, status: EntityStatus.New }],
      });
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [documentPt];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toMatchObject([
        {
          status: EntityStatus.New,
        },
      ]);
    });

    it('should delete EntityStats if there are no valid Documents for paragraph extraction', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        files: [documentEs, customFile],
      });
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [documentPt];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toHaveLength(0);
    });

    it('should do nothing if there is no Document on Files deleted event', async () => {
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [customFile];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
    });

    it('should do nothing if there are no Documents in UI languages among Documents deleted', async () => {
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [documentEs, customFile];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
    });

    it('should do nothing if the deleted Document was not the one used to be extracted', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        files: [documentPt],
      });
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [
        customFile,
        documentEs,
        { ...documentEn, language: documentPt.language },
      ];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
    });

    it('should do nothing if the source Entity was not the one used to be extracted', async () => {
      const eventBus = new EventsBus();
      new PXFilesDeletedListener(eventBus).start();

      const files: FileType[] = [{ ...documentEn, entity: new ObjectId().toString() }];

      await testingEnvironment.runWithContext(async () => {
        await eventBus.emit(new FilesDeletedEvent({ files }));
      });

      const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
    });
  });
});
