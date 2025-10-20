import { ObjectId } from 'mongodb';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { EventsBus } from 'api/core/libs/eventsbus';
import { FileType } from 'shared/types/fileType';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { DBFixture } from 'api/utils/testing_db';
import { tenants } from 'api/tenants';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource';
import { MongoExtractorBuilder } from './MongoPXExtractorBuilder';
import { mongoPXExtractorsCollection } from '../MongoPXExtractorsDataSource';
import { MongoPXEntityStatusDBO } from '../MongoPXEntityStatusDBO';
import { PXFilesDeletedListener } from '../PXFilesDeletedListener';

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
});

const documentEn = factory.document('document_2', {
  language: 'en',
  entity: entity.sharedId,
  creationDate: 2,
});

const documentEs = factory.document('invalid_document', {
  language: 'es',
  entity: entity.sharedId,
  creationDate: 3,
});

const customFile = factory.custom_upload('invalid_custom_file', {
  entity: entity.sharedId,
  creationDate: 4,
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

// eslint-disable-next-line max-statements
describe('PXFilesDeletedListener', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
    tenants.current().featureFlags!.paragraphExtraction = true;
  });

  afterAll(async () => {
    tenants.current().featureFlags!.paragraphExtraction = false;
    await testingEnvironment.tearDown();
  });

  it('should mark EntityStatus as obsolete', async () => {
    await testingEnvironment.setFixtures({ ...createFixtures(), files: [documentEn] });
    const eventBus = new EventsBus();
    new PXFilesDeletedListener(eventBus).start();

    const files: FileType[] = [documentPt];

    await eventBus.emit(new FilesDeletedEvent({ files }));

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

    await eventBus.emit(new FilesDeletedEvent({ files }));

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

    await eventBus.emit(new FilesDeletedEvent({ files }));

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

    await eventBus.emit(new FilesDeletedEvent({ files }));

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

    await eventBus.emit(new FilesDeletedEvent({ files }));

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toHaveLength(0);
  });

  it('should do nothing if there is no Document on Files deleted event', async () => {
    const eventBus = new EventsBus();
    new PXFilesDeletedListener(eventBus).start();

    const files: FileType[] = [customFile];

    await eventBus.emit(new FilesDeletedEvent({ files }));

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
  });

  it('should do nothing if there are no Documents in UI languages among Documents deleted', async () => {
    const eventBus = new EventsBus();
    new PXFilesDeletedListener(eventBus).start();

    const files: FileType[] = [documentEs, customFile];

    await eventBus.emit(new FilesDeletedEvent({ files }));

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

    await eventBus.emit(new FilesDeletedEvent({ files }));

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
  });

  it('should do nothing if the source Entity was not the one used to be extracted', async () => {
    const eventBus = new EventsBus();
    new PXFilesDeletedListener(eventBus).start();

    const files: FileType[] = [{ ...documentEn, entity: new ObjectId().toString() }];

    await eventBus.emit(new FilesDeletedEvent({ files }));

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
  });
});
