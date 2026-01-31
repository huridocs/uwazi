/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { EntitiesDataSourceFactory } from 'api/core/infrastructure/factories/EntitiesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { EntityIcon } from 'api/core/domain/entity/Entity';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { ThesauriDataSourceFactory } from 'api/core/infrastructure/factories/ThesauriDataSourceFactory';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { ObjectId } from 'mongodb';
import { InputFile } from 'api/core/infrastructure/files/InputFile';
import { FilesServiceFactory } from 'api/core/infrastructure/factories/FilesServiceFactory';
import { FileSystemStorage } from 'api/core/infrastructure/files/FileSystemStorage';
import { TestUtils } from 'api/common.v2/utils/Test';
import { EventsBus } from 'api/core/libs/eventsbus/EventsBus';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { EventEmitterFactory } from 'api/core/libs/eventEmitter/EventEmitterFactory';
import { getSharedConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { Listener } from 'api/core/libs/eventEmitter/Listener';
import { EntityUpdatedEvent } from 'api/core/domain/entity/EntityUpdatedEvent';
import { DependenciesContext } from 'api/core/libs/DependenciesContext';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { PropertyAssignmentCreatorServiceStrategy } from '../propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { UpdateEntityUseCase, UpdateEntityUseCaseDeps } from '../UpdateEntity';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],

  translationsV2: [
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
      key: 'Red',
      language: 'en',
      value: 'Red in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
      key: 'Blue',
      language: 'en',
      value: 'Blue in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
      key: 'thesaurus_colors',
      language: 'en',
      value: 'thesaurus_colors in English',
    },
    {
      _id: new ObjectId(),
      key: 'Red',
      value: 'Red in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'Blue',
      value: 'Blue in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'thesaurus_colors',
      value: 'thesaurus_colors in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
    },
  ],

  dictionaries: [
    factory.thesauri('thesaurus_colors', [
      ['red_id', 'Red'],
      ['blue_id', 'Blue'],
      ['green_id', 'Green'],
    ]),
  ],

  relationtypes: [
    {
      _id: factory.id('relation_type'),
      name: 'relation_type',
      properties: [],
      __v: 0,
    },
  ],

  templates: [
    factory.template('Basic Template', []),

    factory.template('Related Template', [factory.property('related_text', 'text')]),

    factory.template('Full Template', [
      factory.property('text', 'text'),
      factory.property('numeric', 'numeric'),
      factory.property('markdown', 'markdown'),
      factory.property('generatedid', 'generatedid'),
      factory.property('date', 'date'),
      factory.property('multidate', 'multidate'),
      factory.property('daterange', 'daterange'),
      factory.property('multidaterange', 'multidaterange'),
      factory.property('link', 'link'),
      factory.property('image', 'image'),
      factory.property('geolocation_geolocation', 'geolocation'),
      factory.property('select', 'select', {
        content: factory.id('thesaurus_colors').toHexString(),
      }),
      factory.property('multiselect', 'multiselect', {
        content: factory.id('thesaurus_colors').toHexString(),
      }),
      factory.property('relationship', 'relationship', {
        relationType: factory.id('relation_type').toHexString(),
        content: factory.id('Related Template').toHexString(),
        inherit: {
          property: factory.id('related_text').toHexString(),
          type: 'text',
        },
      }),
      factory.property('nested', 'nested'),
      factory.property('preview', 'preview'),
      factory.property('media', 'media'),
    ]),
  ],

  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'entity1',
      'Basic Template',
      {},
      { title: 'Entity 1' },
      {
        en: {
          title: 'Entity 1 EN',
        },
        pt: {
          title: 'Entity 1 PT',
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'related_entity',
      'Related Template',
      {},
      { title: 'Related Entity' },
      {
        en: {
          title: 'Related Entity EN',
          metadata: {
            related_text: [factory.metadataValue('Related Text EN')],
          },
        },
        pt: {
          title: 'Related Entity PT',
          metadata: {
            related_text: [factory.metadataValue('Related Text PT')],
          },
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'related_entity_2',
      'Related Template',
      {},
      { title: 'Related Entity 2' },
      {
        en: {
          title: 'Related Entity 2 EN',
          metadata: {
            related_text: [factory.metadataValue('Related Text 2 EN')],
          },
        },
        pt: {
          title: 'Related Entity 2 PT',
          metadata: {
            related_text: [factory.metadataValue('Related Text 2 PT')],
          },
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'full_entity',
      'Full Template',
      {},
      { title: 'Full Entity' },
      {
        en: {
          title: 'Full Entity EN',
          metadata: {
            text: [factory.metadataValue('Some text value')],
            numeric: [factory.metadataValue(42)],
            markdown: [factory.metadataValue('Some **markdown**')],
            generatedid: [factory.metadataValue('GEN-123')],
            date: [factory.metadataValue(1609459200)],
            multidate: [factory.metadataValue(1609459200), factory.metadataValue(1612137600)],
            daterange: [factory.metadataValue({ from: 1609459200, to: 1612137600 })],
            multidaterange: [
              factory.metadataValue({ from: 1609459200, to: 1612137600 }),
              factory.metadataValue({ from: 1614556800, to: 1617235200 }),
            ],
            link: [factory.metadataValue({ url: 'https://uwazi.io', label: 'Uwazi' })],
            image: [factory.metadataValue('https://example.com/image.jpg')],
            geolocation_geolocation: [factory.metadataValue({ lat: 10, lon: 20 })],
            select: [{ value: 'red_id', label: 'Red in English' }],
            multiselect: [
              { value: 'red_id', label: 'Red in English' },
              { value: 'blue_id', label: 'Blue in English' },
            ],
            relationship: [
              {
                value: 'related_entity',
                label: 'Related Entity EN',
                type: 'entity',
                inheritedType: 'text',
                inheritedValue: [factory.metadataValue('Related Text EN')],
              },
            ],
            nested: [
              factory.metadataValue({
                //@ts-ignore
                child_text: [factory.metadataValue('Child text value')],
                child_number: [factory.metadataValue(100)],
              }),
            ],
            preview: [],
            media: [factory.metadataValue('https://example.com/video.mp4')],
          },
        },
        pt: {
          title: 'Full Entity PT',
          metadata: {
            text: [factory.metadataValue('Some text value')],
            numeric: [factory.metadataValue(42)],
            markdown: [factory.metadataValue('Some **markdown**')],
            generatedid: [factory.metadataValue('GEN-123')],
            date: [factory.metadataValue(1609459200)],
            multidate: [factory.metadataValue(1609459200), factory.metadataValue(1612137600)],
            daterange: [factory.metadataValue({ from: 1609459200, to: 1612137600 })],
            multidaterange: [
              factory.metadataValue({ from: 1609459200, to: 1612137600 }),
              factory.metadataValue({ from: 1614556800, to: 1617235200 }),
            ],
            link: [factory.metadataValue({ url: 'https://uwazi.io', label: 'Uwazi' })],
            image: [factory.metadataValue('https://example.com/image.jpg')],
            geolocation_geolocation: [factory.metadataValue({ lat: 10, lon: 20 })],
            select: [{ value: 'red_id', label: 'Red in Portuguese' }],
            multiselect: [
              { value: 'red_id', label: 'Red in Portuguese' },
              { value: 'blue_id', label: 'Blue in Portuguese' },
            ],
            relationship: [
              {
                value: 'related_entity',
                label: 'Related Entity PT',
                type: 'entity',
                inheritedType: 'text',
                inheritedValue: [factory.metadataValue('Related Text PT')],
              },
            ],
            nested: [
              factory.metadataValue({
                //@ts-ignore
                child_text: [factory.metadataValue('Child text value')],
                child_number: [factory.metadataValue(100)],
              }),
            ],
            preview: [],
            media: [factory.metadataValue('https://example.com/video.mp4')],
          },
        },
      }
    ),
  ],
};

class SampleListener extends Listener<any> {
  static eventName = EntityUpdatedEvent.name;

  // eslint-disable-next-line class-methods-use-this
  protected async handle(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

const createSut = (_deps?: Partial<UpdateEntityUseCaseDeps>) => {
  const transactionManager = TransactionManagerFactory.default();

  const entitiesDS = EntitiesDataSourceFactory.default(transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const idGenerator = IdGeneratorFactory.default();

  const propertyAssignmentCreatorServiceStrategy = PropertyAssignmentCreatorServiceStrategy.create({
    entitiesDS,
    settingsDS,
    thesauriDS,
    translationsDS,
  });

  const fileStorage = TestUtils.mockClass<FileSystemStorage>({ storeFile: jest.fn() });
  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

  const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
  const eventEmitter = EventEmitterFactory.default();
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const fileService = FilesServiceFactory.default(transactionManager, { fileStorage, eventBus });

  jest.spyOn(fileService, 'storeFiles').mockResolvedValue();
  jest.spyOn(fileService, 'insert').mockResolvedValue();

  const sut = new UpdateEntityUseCase(
    {
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

  DependenciesContext.attachContext(sut, {
    transactionManager,
    idGenerator,
    eventEmitter,
    jobsDispatcher,
  });

  return { sut, fileService };
};

describe('UpdateEntityUseCase', () => {
  const icon: EntityIcon = { id: 'iconId', type: 'entity', label: 'iconLabel' };

  const getAllEntities = async (sharedId: string) =>
    testingEnvironment.db.getCollection('entities')!.find({ sharedId }).toArray();

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
  });

  it('should update basic entity data', async () => {
    const { sut } = createSut();

    const entitiesBefore = await getAllEntities('entity1');

    await sut.execute({ sharedId: 'entity1', language: 'en', icon, generatedToc: true });

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
          // {
          //   name: 'nested',
          //   value: [],
          // },
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
                icon: null,
                type: 'entity',
                inheritedType: 'text',
                inheritedValue: [{ value: 'Related Text 2 EN' }],
              },
            ],
            image: [],
            media: [],
          },
          language: 'en',
          creationDate: null,
          editDate: expect.any(Number),
          icon: null,
          obsoleteMetadata: [],
          permissions: [],
          published: false,
          user: null,
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
                icon: null,
                type: 'entity',
                inheritedType: 'text',
                inheritedValue: [{ value: 'Related Text 2 PT' }],
              },
            ],
          },
          language: 'pt',
          creationDate: null,
          editDate: expect.any(Number),
          icon: null,
          obsoleteMetadata: [],
          permissions: [],
          published: false,
          user: null,
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
  });

  describe('When Files gets uploaded', () => {
    it('should add files', async () => {
      const { sut, fileService } = createSut();

      await sut.execute({
        language: 'en',
        sharedId: 'entity1',
        inputFiles: [
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
        inputFiles: [
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
        inputFiles: [
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
        inputFiles: [
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
        inputFiles: [
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

  it('should emit EntityUpdatedEvent after updating the entity', async () => {
    const { sut } = createSut();

    await sut.execute({
      language: 'en',
      sharedId: 'entity1',
      propertyAssignments: [{ name: 'title', value: [{ value: 'Entity Updated EN' }] }],
    });

    const jobs = await getAllJobs();

    expect(jobs.length).toBe(1);

    expect(jobs).toMatchObject([
      {
        queue: 'uwazi_jobs',
        name: 'EntityUpdatedEvent:SampleListener',
        params: {
          after: expect.any(Object),
          before: expect.any(Object),
          userId: expect.any(String),
          targetLanguage: 'en',
        },
      },
    ]);
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
