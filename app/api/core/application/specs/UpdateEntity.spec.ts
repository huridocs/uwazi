/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EntityIcon } from '#api/core/domain/entity/Entity.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { EventsBus } from '#api/core/libs/eventsbus/EventsBus.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { getSharedConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { PropertyAssignmentCreatorServiceStrategy } from '../propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { UpdateEntityUseCase, UpdateEntityUseCaseDeps } from '../UpdateEntity.js';
import { factory, fixtures, SampleListener } from './UpdateEntityFixtures.js';

const createSut = (_deps?: Partial<UpdateEntityUseCaseDeps>) => {
  const transactionManager = TransactionManagerFactory.default();

  const entitiesDS = EntitiesDataSourceFactory.forTesting(transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const idGenerator = IdGeneratorFactory.default();

  const propertyAssignmentCreatorServiceStrategy =
    PropertyAssignmentCreatorServiceStrategy.createWithRequired({
      entitiesDS,
      settingsDS,
      thesauriDS,
      translationsDS,
    });

  const fileStorage = TestUtils.mockClass<FileSystemStorage>({ storeFile: jest.fn() });
  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

  const filesDS = FilesDataSourceFactory.default(transactionManager);
  const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
  const eventEmitter = EventEmitterFactory.default();
  const templatesDS = TemplatesDataSourceFactory.forTesting(transactionManager);
  const fileService = FilesServiceFactory.default(transactionManager, {
    fileStorage,
    eventBus,
    filesDS,
  });

  const entitiesService = EntitiesServiceFactory.default({
    transactionManager,
    entitiesDS,
    eventEmitter,
    templatesDS,
  });

  jest.spyOn(fileService, 'storeFiles').mockResolvedValue();
  jest.spyOn(fileService, 'insert').mockResolvedValue();
  jest.spyOn(fileService, 'delete');

  const sut = new UpdateEntityUseCase(
    {
      entitiesService,
      filesDS,
      templatesDS,
      idGenerator,
      fileService,
      propertyAssignmentCreatorServiceStrategy,
      entitiesDS,
      transactionManager,
      eventEmitter,
    },
    { actor: permissionsContext.getUserInContext()!, tenant: tenants.current() }
  );

  DependenciesContext.attachContext(sut, 'execute', {
    factories: {
      transactionManager: () => transactionManager,
      idGenerator: () => idGenerator,
      eventEmitter: () => eventEmitter,
      jobsDispatcher: () => jobsDispatcher,
      logger: () => TestUtils.mockClass({}),
      authorizedEntityESClient: () => TestUtils.mockClass({}),
      elasticClient: () => TestUtils.mockClass({}),
    },
  });

  return { sut, fileService };
};

describe('UpdateEntityUseCase', () => {
  const icon: EntityIcon = { id: 'iconId', type: 'entity', label: 'iconLabel' };

  const getAllEntities = async (sharedId: string) =>
    testingEnvironment.db.getCollection('entities')!.find({ sharedId }).toArray();

  const getAllFiles = async (entity: string) =>
    testingEnvironment.db.getCollection('files')!.find({ entity }).toArray();

  const getAllJobs = async () => getSharedConnection().collection('jobs').find().toArray();
  const clearJobs = async () => getSharedConnection().collection('jobs').deleteMany({});

  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
    EventEmitterFactory.default().listen(SampleListener);
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await clearJobs();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
    EventEmitterFactory.default().reset();
  });

  it('should update basic entity data', async () => {
    const { sut } = createSut();

    const entitiesBefore = await getAllEntities('entity1');

    await sut.execute({ sharedId: 'entity1', language: 'en', icon, propertyAssignments: [] });

    const entities = await getAllEntities('entity1');
    expect(entitiesBefore).toMatchObject([
      {
        sharedId: 'entity1',
        title: 'Entity 1 EN',
        template: factory.id('Basic Template'),
        metadata: {},
        language: 'en',
      },
      {
        sharedId: 'entity1',
        title: 'Entity 1 PT',
        template: factory.id('Basic Template'),
        metadata: {},
        language: 'pt',
      },
    ]);

    expect(entities).toMatchObject([
      {
        sharedId: 'entity1',
        template: factory.id('Basic Template'),
        metadata: {},
        language: 'en',
        editDate: expect.any(Number),
        icon: { _id: 'iconId', label: 'iconLabel', type: 'entity' },
      },
      {
        sharedId: 'entity1',
        template: factory.id('Basic Template'),
        metadata: {},
        language: 'pt',
        editDate: expect.any(Number),
        icon: { _id: 'iconId', label: 'iconLabel', type: 'entity' },
      },
    ]);
  });

  it('should update title', async () => {
    const { sut } = createSut();

    await sut.execute({
      sharedId: 'entity1',
      language: 'en',
      propertyAssignments: [{ name: 'title', value: [{ value: 'Entity Updated EN' }] }],
    });

    const entities = await getAllEntities('entity1');

    expect(entities).toMatchObject([
      {
        sharedId: 'entity1',
        title: 'Entity Updated EN',
        template: factory.id('Basic Template'),
        metadata: {},
        language: 'en',
      },
      {
        sharedId: 'entity1',
        title: 'Entity 1 PT',
        template: factory.id('Basic Template'),
        metadata: {},
        language: 'pt',
      },
    ]);
  });

  describe('When Property Assignments gets updated', () => {
    it('should update property assignments', async () => {
      const { sut } = createSut();

      const now = Date.now();

      await sut.execute({
        sharedId: 'full_entity',
        language: 'en',
        propertyAssignments: [
          {
            name: 'title',
            value: [{ value: 'Title EN' }],
          },
          {
            name: 'text',
            value: [{ value: 'Text EN' }],
          },
          {
            name: 'markdown',
            value: [{ value: 'Markdown EN' }],
          },
          {
            name: 'numeric',
            value: [{ value: 0 }],
          },
          {
            name: 'date',
            value: [{ value: now }],
          },
          {
            name: 'multidate',
            value: [{ value: now }, { value: now + 1000 }],
          },
          {
            name: 'daterange',
            value: [{ value: { from: now, to: now + 1000 } }],
          },
          {
            name: 'multidaterange',
            value: [
              { value: { from: 1609459200, to: 1612137600 } },
              { value: { from: 1614556800, to: 1617235200 } },
              { value: { from: now, to: now + 1000 } },
            ],
          },
          {
            name: 'link',
            value: [{ value: { url: 'http://example.com', label: 'New Link' } }],
          },
          {
            name: 'geolocation_geolocation',
            value: [{ value: { lat: 10, lon: 10 } }],
          },
          {
            name: 'select',
            value: [{ value: 'blue_id' }],
          },
          {
            name: 'multiselect',
            value: [{ value: 'blue_id' }],
          },
          {
            name: 'relationship',
            value: [{ value: 'related_entity_2' }],
          },
          {
            name: 'image',
            value: [{ value: '' }], // This unlink the property assignment to the attached file.
          },
          {
            name: 'media',
            value: [{ value: '' }], // This unlink the property assignment to the attached file.
          },
          {
            name: 'nested',
            value: [
              {
                value: {
                  child_text: [{ value: 'Child text value' }],
                  child_number: [{ value: 42 }],
                },
              },
              {
                value: {
                  child_text: [{ value: 'Second child text' }],
                  child_number: [{ value: 100 }],
                },
              },
            ],
          },
        ],
      });

      const entities = await getAllEntities('full_entity');

      expect(entities).toMatchObject([
        {
          sharedId: 'full_entity',
          title: 'Title EN',
          template: factory.id('Full Template'),
          metadata: {
            text: [{ value: 'Text EN' }],
            numeric: [{ value: 0 }],
            markdown: [{ value: 'Markdown EN' }],
            generatedid: [{ value: 'GEN-123' }],
            date: [{ value: now }],
            multidate: [{ value: now }, { value: now + 1000 }],
            daterange: [{ value: { from: now, to: now + 1000 } }],
            multidaterange: [
              { value: { from: 1609459200, to: 1612137600 } },
              { value: { from: 1614556800, to: 1617235200 } },
              { value: { from: now, to: now + 1000 } },
            ],
            link: [{ value: { url: 'http://example.com', label: 'New Link' } }],
            geolocation_geolocation: [{ value: { lat: 10, lon: 10 } }],
            select: [{ value: 'blue_id', label: 'Blue in English' }],
            multiselect: [{ value: 'blue_id', label: 'Blue in English' }],
            relationship: [
              {
                value: 'related_entity_2',
                label: 'Related Entity 2 EN',
                type: 'entity',
                inheritedType: 'text',
                inheritedValue: [{ value: 'Related Text 2 EN' }],
              },
            ],
            image: [],
            nested: [
              {
                value: {
                  child_text: [{ value: 'Child text value' }],
                  child_number: [{ value: 42 }],
                },
              },
              {
                value: {
                  child_text: [{ value: 'Second child text' }],
                  child_number: [{ value: 100 }],
                },
              },
            ],
            media: [],
          },
          language: 'en',
          editDate: expect.any(Number),
          icon: {
            _id: null,
            type: 'Empty',
          },
          obsoleteMetadata: [],
          permissions: [],
          published: false,
        },
        {
          sharedId: 'full_entity',
          title: 'Full Entity PT',
          template: factory.id('Full Template'),
          metadata: {
            text: [{ value: 'Some text value' }],
            numeric: [{ value: 0 }],
            markdown: [{ value: 'Some **markdown**' }],
            generatedid: [{ value: 'GEN-123' }],
            date: [{ value: now }],
            multidate: [{ value: now }, { value: now + 1000 }],
            daterange: [{ value: { from: now, to: now + 1000 } }],
            multidaterange: [
              { value: { from: 1609459200, to: 1612137600 } },
              { value: { from: 1614556800, to: 1617235200 } },
              { value: { from: now, to: now + 1000 } },
            ],
            link: [{ value: { url: 'https://uwazi.io', label: 'Uwazi' } }],
            image: [{ value: 'https://example.com/image.jpg' }],
            media: [{ value: 'https://example.com/video.mp4' }],
            geolocation_geolocation: [{ value: { lat: 10, lon: 10 } }],
            select: [{ value: 'blue_id', label: 'Blue in Portuguese' }],
            multiselect: [{ value: 'blue_id', label: 'Blue in Portuguese' }],
            relationship: [
              {
                value: 'related_entity_2',
                label: 'Related Entity 2 PT',
                type: 'entity',
                inheritedType: 'text',
                inheritedValue: [{ value: 'Related Text 2 PT' }],
              },
            ],
            nested: [
              {
                value: {
                  child_text: [{ value: 'Child text value' }],
                  child_number: [{ value: 42 }],
                },
              },
              {
                value: {
                  child_text: [{ value: 'Second child text' }],
                  child_number: [{ value: 100 }],
                },
              },
            ],
          },
          language: 'pt',
          editDate: expect.any(Number),
          icon: {
            _id: null,
            type: 'Empty',
          },
          obsoleteMetadata: [],
          permissions: [],
          published: false,
        },
      ]);
    });

    it('should clear metadata when given empty or nullable values', async () => {
      const { sut } = createSut();

      await sut.execute({
        sharedId: 'full_entity',
        language: 'en',
        propertyAssignments: [
          {
            name: 'text',
            value: [{ value: '' }],
          },
          {
            name: 'numeric',
            value: [{ value: '' }],
          },
          {
            name: 'select',
            value: [{ value: '' }],
          },
          {
            name: 'multiselect',
            value: [],
          },
          {
            name: 'relationship',
            value: [],
          },
          {
            name: 'date',
            value: [],
          },
          {
            name: 'multidate',
            value: [],
          },
          {
            name: 'daterange',
            value: [],
          },
          {
            name: 'multidaterange',
            value: [],
          },
          {
            name: 'link',
            value: [],
          },
          {
            name: 'geolocation_geolocation',
            value: [],
          },
        ],
      });

      const entities = await getAllEntities('full_entity');

      expect([entities[0].metadata, entities[1].metadata]).toMatchObject([
        {
          text: [],
          numeric: [],
          date: [],
          multidate: [],
          daterange: [],
          multidaterange: [],
          link: [],
          geolocation_geolocation: [],
          select: [],
          multiselect: [],
          relationship: [],

          nested: [
            {
              value: {
                child_text: [{ value: 'Child text value' }],
                child_number: [{ value: 100 }],
              },
            },
          ],
          markdown: [{ value: 'Some **markdown**' }],
          generatedid: [{ value: 'GEN-123' }],
          image: [{ value: 'https://example.com/image.jpg' }],
          preview: [],
          media: [{ value: 'https://example.com/video.mp4' }],
        },
        {
          numeric: [],
          date: [],
          multidate: [],
          daterange: [],
          multidaterange: [],
          geolocation_geolocation: [],
          select: [],
          multiselect: [],
          relationship: [],

          text: [{ value: 'Some text value' }],
          markdown: [{ value: 'Some **markdown**' }],
          generatedid: [{ value: 'GEN-123' }],
          link: [{ value: { url: 'https://uwazi.io', label: 'Uwazi' } }],
          image: [{ value: 'https://example.com/image.jpg' }],
          nested: [
            {
              value: {
                child_text: [{ value: 'Child text value' }],
                child_number: [{ value: 100 }],
              },
            },
          ],
          preview: [],
          media: [{ value: 'https://example.com/video.mp4' }],
        },
      ]);
    });
    it('should throw when a required property has no value', async () => {
      const { sut } = createSut();

      await expect(
        sut.execute({
          sharedId: 'required_entity',
          language: 'en',
          propertyAssignments: [{ name: 'required_text', value: [{ value: '' }] }],
        })
      ).rejects.toThrow('Text Property is required');
    });
  });

  describe('When Files gets uploaded', () => {
    it('should add files', async () => {
      const { sut, fileService } = createSut();

      await sut.execute({
        language: 'en',
        sharedId: 'entity1',
        propertyAssignments: [],
        uploadedFiles: [
          new InputFile(
            {
              fieldname: 'documents[0]',
              encoding: '7bit',
              mimetype: 'application/pdf',
              destination: '/tmp',
              originalname: 'primary_1.pdf',
              filename: 'primary_1.pdf',
              path: '/tmp/primary_1.pdf',
              size: 78636,
            },
            'document'
          ),

          new InputFile(
            {
              fieldname: 'documents[1]',
              encoding: '7bit',
              mimetype: 'application/pdf',
              destination: '/tmp',
              originalname: 'primary_2.pdf',
              filename: 'primary_2.pdf',
              path: '/tmp/primary_2.pdf',
              size: 78636,
            },
            'document'
          ),

          new InputFile(
            {
              fieldname: 'attachments[0]',
              encoding: '7bit',
              mimetype: 'image/png',
              destination: '/tmp',
              originalname: 'attachment_1.png',
              filename: 'attachment_1.png',
              path: '/tmp/attachment_1.png',
              size: 78636,
            },
            'attachment'
          ),
        ],
      });

      expect(fileService.storeFiles).toHaveBeenCalledWith([
        expect.objectContaining({ originalname: 'primary_1.pdf' }),
        expect.objectContaining({ originalname: 'primary_2.pdf' }),
        expect.objectContaining({ originalname: 'attachment_1.png' }),
      ]);

      expect(fileService.insert).toHaveBeenCalledWith([
        expect.objectContaining({ originalname: 'primary_1.pdf' }),
        expect.objectContaining({ originalname: 'primary_2.pdf' }),
        expect.objectContaining({ originalname: 'attachment_1.png' }),
      ]);
    });

    it('should link image property to uploaded file', async () => {
      const { sut } = createSut();

      await sut.execute({
        language: 'en',
        sharedId: 'full_entity',
        propertyAssignments: [
          {
            name: 'image',
            value: [{ value: '', attachment: 0 }],
          },
        ],
        uploadedFiles: [
          new InputFile(
            {
              fieldname: 'attachments[0]',
              encoding: '7bit',
              mimetype: 'image/png',
              destination: '/tmp',
              originalname: 'new_image.png',
              filename: 'generated_filename_123.png',
              path: '/tmp/generated_filename_123.png',
              size: 50000,
            },
            'attachment'
          ),
        ],
      });

      const entities = await getAllEntities('full_entity');

      expect(entities[0].metadata.image).toMatchObject([
        { value: '/api/files/generated_filename_123.png' },
      ]);
    });

    it('should link media property to uploaded file', async () => {
      const { sut } = createSut();

      await sut.execute({
        language: 'en',
        sharedId: 'full_entity',
        propertyAssignments: [
          {
            name: 'media',
            value: [{ value: '', attachment: 0 }],
          },
        ],
        uploadedFiles: [
          new InputFile(
            {
              fieldname: 'attachments[0]',
              encoding: '7bit',
              mimetype: 'video/mp4',
              destination: '/tmp',
              originalname: 'new_video.mp4',
              filename: 'generated_video_456.mp4',
              path: '/tmp/generated_video_456.mp4',
              size: 1000000,
            },
            'attachment'
          ),
        ],
      });

      const entities = await getAllEntities('full_entity');

      expect(entities[0].metadata.media).toMatchObject([
        { value: '/api/files/generated_video_456.mp4' },
      ]);
    });

    it('should link media property with timeLinks to uploaded file', async () => {
      const { sut } = createSut();

      await sut.execute({
        language: 'en',
        sharedId: 'full_entity',
        propertyAssignments: [
          {
            name: 'media',
            value: [{ value: '', attachment: 0, timeLinks: '{"start": 10, "end": 20}' }],
          },
        ],
        uploadedFiles: [
          new InputFile(
            {
              fieldname: 'attachments[0]',
              encoding: '7bit',
              mimetype: 'video/mp4',
              destination: '/tmp',
              originalname: 'video_with_timelinks.mp4',
              filename: 'generated_video_789.mp4',
              path: '/tmp/generated_video_789.mp4',
              size: 1000000,
            },
            'attachment'
          ),
        ],
      });

      const entities = await getAllEntities('full_entity');

      expect(entities[0].metadata.media).toMatchObject([
        { value: '(/api/files/generated_video_789.mp4, {"start": 10, "end": 20})' },
      ]);
    });

    it('should link multiple files to different properties in same request', async () => {
      const { sut } = createSut();

      await sut.execute({
        language: 'en',
        sharedId: 'full_entity',
        propertyAssignments: [
          {
            name: 'image',
            value: [{ value: '', attachment: 0 }],
          },
          {
            name: 'media',
            value: [{ value: '', attachment: 1, timeLinks: '{"label": "intro"}' }],
          },
        ],
        uploadedFiles: [
          new InputFile(
            {
              fieldname: 'attachments[0]',
              encoding: '7bit',
              mimetype: 'image/jpeg',
              destination: '/tmp',
              originalname: 'photo.jpg',
              filename: 'photo_abc.jpg',
              path: '/tmp/photo_abc.jpg',
              size: 50000,
            },
            'attachment'
          ),
          new InputFile(
            {
              fieldname: 'attachments[1]',
              encoding: '7bit',
              mimetype: 'video/mp4',
              destination: '/tmp',
              originalname: 'clip.mp4',
              filename: 'clip_xyz.mp4',
              path: '/tmp/clip_xyz.mp4',
              size: 800000,
            },
            'attachment'
          ),
        ],
      });

      const entities = await getAllEntities('full_entity');

      expect(entities[0].metadata.image).toMatchObject([{ value: '/api/files/photo_abc.jpg' }]);
      expect(entities[0].metadata.media).toMatchObject([
        { value: '(/api/files/clip_xyz.mp4, {"label": "intro"})' },
      ]);
    });
  });

  describe('When Files gets updated', () => {
    it('should rename existing files', async () => {
      const { sut } = createSut();

      const filesBefore = await getAllFiles('entity1');

      await sut.execute({
        language: 'en',
        sharedId: 'entity1',
        propertyAssignments: [],
        files: [
          {
            id: factory.id('entity1_doc1').toHexString(),
            originalname: 'Document 1 Renamed.pdf',
          },
          {
            id: factory.id('entity1_doc2').toHexString(),
            originalname: 'Document 2 Renamed.pdf',
          },
          {
            id: factory.id('entity1_attach1').toHexString(),
            originalname: 'Attachment 1 Renamed.txt',
          },
        ],
      });

      const filesAfter = await getAllFiles('entity1');

      expect(filesBefore).toMatchObject([
        { entity: 'entity1', originalname: 'Document 1.pdf' },
        {
          entity: 'entity1',
          type: 'thumbnail',
          filename: `${factory.id('entity1_doc1').toHexString()}.jpg`,
        },
        { entity: 'entity1', originalname: 'Document 2.pdf' },
        {
          entity: 'entity1',
          type: 'thumbnail',
          filename: `${factory.id('entity1_doc2').toHexString()}.jpg`,
        },
        { entity: 'entity1', originalname: 'Attachment 1.txt' },
      ]);

      expect(filesAfter).toMatchObject([
        { entity: 'entity1', originalname: 'Document 1 Renamed.pdf' },
        {
          entity: 'entity1',
          type: 'thumbnail',
          filename: `${factory.id('entity1_doc1').toHexString()}.jpg`,
        },
        { entity: 'entity1', originalname: 'Document 2 Renamed.pdf' },
        {
          entity: 'entity1',
          type: 'thumbnail',
          filename: `${factory.id('entity1_doc2').toHexString()}.jpg`,
        },
        { entity: 'entity1', originalname: 'Attachment 1 Renamed.txt' },
      ]);
    });
  });

  describe('When Files gets removed', () => {
    it('should delete files that are not in the files array', async () => {
      const { sut } = createSut();

      await sut.execute({
        language: 'en',
        sharedId: 'entity1',
        propertyAssignments: [],
        files: [
          {
            id: factory.id('entity1_doc1').toHexString(),
            originalname: 'Document 1.pdf',
          },
        ],
      });

      const filesAfter = await getAllFiles('entity1');

      expect(filesAfter).toHaveLength(2);
      expect(filesAfter).toMatchObject([
        {
          filename: 'entity1_doc1',
          originalname: 'Document 1.pdf',
          entity: 'entity1',
          type: 'document',
        },
        {
          _id: factory.id('entity1_doc1_thumbnail'),
          entity: 'entity1',
          type: 'thumbnail',
        },
      ]);
    });
  });

  it('should emit EntityUpdatedEvent after updating the entity', async () => {
    const { sut } = createSut();

    await sut.execute({
      language: 'en',
      sharedId: 'entity1',
      propertyAssignments: [{ name: 'title', value: [{ value: 'Entity Updated EN' }] }],
    });

    const jobs = await getAllJobs();

    expect(jobs.length).toBeGreaterThanOrEqual(1);

    expect(jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          queue: 'uwazi_jobs',
          name: 'EntityUpdatedEvent:SampleListener',
          params: expect.objectContaining({
            after: expect.any(Object),
            before: expect.any(Object),
            userId: expect.any(String),
            targetLanguage: 'en',
          }),
        }),
      ])
    );
  });

  it('should change entity template', async () => {
    const { sut } = createSut();

    await sut.execute({
      sharedId: 'entity1',
      language: 'en',
      templateId: factory.id('Full Template').toHexString(),
      propertyAssignments: [
        { name: 'title', value: [{ value: 'Entity with new template' }] },
        { name: 'text', value: [{ value: 'Some text' }] },
        { name: 'numeric', value: [{ value: 100 }] },
      ],
    });

    const entities = await getAllEntities('entity1');

    expect(entities).toMatchObject([
      {
        sharedId: 'entity1',
        title: 'Entity with new template',
        template: factory.id('Full Template'),
        language: 'en',
        metadata: {
          text: [{ value: 'Some text' }],
          numeric: [{ value: 100 }],
        },
      },
      {
        sharedId: 'entity1',
        title: 'Entity 1 PT',
        template: factory.id('Full Template'),
        language: 'pt',
        metadata: {
          text: [],
          numeric: [{ value: 100 }],
        },
      },
    ]);
  });
});
