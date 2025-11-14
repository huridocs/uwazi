/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { UseCaseContext } from 'api/core/libs/UseCase';
import { ObjectId } from 'mongodb';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileSystemStorage } from 'api/files.v2/infrastructure/FileSystemStorage';
import { TestUtils } from 'api/common.v2/utils/Test';
import { InputFile } from 'api/files.v2/model/InputFile';
import { tenants } from 'api/tenants';
import { PermissionType } from 'api/core/domain/entity/PermissionType';
import { AccessLevel } from 'api/core/domain/entity/AccessLevel';
import { CreateEntityUseCase } from '../CreateEntity';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  translationsV2: [
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_fruits',
        id: factory.id('thesaurus_fruits').toHexString(),
      },
      key: 'Apple',
      language: 'en',
      value: 'Apple in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_fruits',
        id: factory.id('thesaurus_fruits').toHexString(),
      },
      key: 'Banana',
      language: 'en',
      value: 'Banana in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_fruits',
        id: factory.id('thesaurus_fruits').toHexString(),
      },
      key: 'thesaurus_fruits',
      language: 'en',
      value: 'thesaurus_fruits in English',
    },

    {
      _id: new ObjectId(),
      key: 'Apple',
      value: 'Apple in Spanish',
      language: 'es',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_fruits',
        id: factory.id('thesaurus_fruits').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'Banana',
      value: 'Banana in Spanish',
      language: 'es',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_fruits',
        id: factory.id('thesaurus_fruits').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'thesaurus_fruits',
      value: 'thesaurus_fruits in Spanish',
      language: 'es',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_fruits',
        id: factory.id('thesaurus_fruits').toHexString(),
      },
    },
  ],

  dictionaries: [
    factory.thesauri('thesaurus_fruits', [
      ['apple_id', 'Apple'],
      ['banana_id', 'Banana'],
      ['orange_id', 'Orange'],
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
    factory.template('Document B', [factory.property('text_1', 'text')]),

    factory.template('Document', [
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
      factory.property('attached_image_1', 'image'),
      factory.property('attached_image_2', 'image'),
      factory.property('geolocation_geolocation', 'geolocation'),
      factory.property('select', 'select', {
        content: factory.id('thesaurus_fruits').toHexString(),
      }),
      factory.property('multiselect', 'multiselect', {
        content: factory.id('thesaurus_fruits').toHexString(),
      }),
      factory.property('text_rel', 'relationship', {
        relationType: factory.id('relation_type').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('text_1').toHexString(),
          type: 'text',
        },
      }),
      factory.property('nested', 'nested'),
      factory.property('preview', 'preview'),
      factory.property('media', 'media'),
      factory.property('attached_media_1', 'media'),
      factory.property('attached_media_2', 'media'),
    ]),
  ],

  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'B1',
      'Document B',
      {},
      { title: 'B1' },
      {
        en: {
          title: 'B1 EN',
          metadata: {
            text_1: [factory.metadataValue('B1 Text EN')],
          },
        },
        es: {
          title: 'B1 ES',
          metadata: {
            text_1: [factory.metadataValue('B1 Text ES')],
          },
        },
      }
    ),
  ],
};

type CreateSutProps = {
  context?: UseCaseContext;
};

const createSut = (props: CreateSutProps = {}) => {
  const { context } = props;
  const transactionManager = TransactionManagerFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);

  const multiLanguageEntityDS = new MongoMultiLanguageEntityDataSource(
    getConnection(),
    transactionManager
  );

  const filesDS = DefaultFilesDataSource(transactionManager);

  const filesStorage = TestUtils.mockClass<FileSystemStorage>({ storeFile: jest.fn() });

  const sut = new CreateEntityUseCase(
    {
      transactionManager,
      idGenerator,
      settingsDS,
      multiLanguageEntityDS,
      templatesDS,
      thesauriDS,
      translationsDS,
      filesDS,
      filesStorage,
    },
    context
  );

  return { sut, filesStorage };
};

describe('CreateEntityUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Entity', async () => {
    const { sut, filesStorage } = createSut();

    const entity = await sut.execute({
      templateId: factory.id('Document').toHexString(),
      attachments: [
        new InputFile(
          {
            fieldname: 'attachments[0]',
            encoding: '7bit',
            mimetype: 'image/png',
            destination: '/tmp',
            originalname: 'Attachment 1.png',
            filename: '1762280821775nhs3epb55g7.png',
            path: '/tmp/1762280821775nhs3epb55g7.png',
            size: 78636,
          },
          'attachment'
        ),
        new InputFile(
          {
            fieldname: 'attachments[1]',
            encoding: '7bit',
            mimetype: 'image/png',
            destination: '/tmp',
            originalname: 'Attachment 2.png',
            filename: '1162280821775nhs3epb55g7.png',
            path: '/tmp/1162280821775nhs3epb55g7.png',
            size: 78636,
          },
          'attachment'
        ),
        new InputFile(
          {
            fieldname: 'attachments[2]',
            encoding: '7bit',
            mimetype: 'video/mp4',
            destination: '/tmp',
            originalname: 'Attachment 3.mp4',
            filename: 'attachment_3.mp4',
            path: '/tmp/attachment_3.mp4',
            size: 78636,
          },
          'attachment'
        ),
        new InputFile(
          {
            fieldname: 'attachments[3]',
            encoding: '7bit',
            mimetype: 'video/mp4',
            destination: '/tmp',
            originalname: 'Attachment 4.mp4',
            filename: 'attachment_4.mp4',
            path: '/tmp/attachment_4.mp4',
            size: 78636,
          },
          'attachment'
        ),
      ],
      propertyAssignments: [
        { name: 'title', value: [{ value: 'My entity title' }] },
        { name: 'text', value: [{ value: 'Some text' }] },
        { name: 'numeric', value: [{ value: 42 }] },
        { name: 'markdown', value: [{ value: 'Some **markdown**' }] },
        { name: 'generatedid', value: [{ value: 'CPW6528-7568' }] },
        { name: 'date', value: [{ value: 1761576489 }] },
        { name: 'multidate', value: [{ value: 1761576489 }, { value: 1761576489 }] },
        { name: 'daterange', value: [{ value: { from: 1761576489, to: 1761576489 } }] },
        {
          name: 'multidaterange',
          value: [
            { value: { from: 1761576489, to: 1761576490 } },
            { value: { from: 1761576489, to: 1761576490 } },
          ],
        },
        { name: 'link', value: [{ value: { url: 'https://uwazi.io', label: 'Uwazi' } }] },
        { name: 'geolocation_geolocation', value: [{ value: { lat: 10, lon: 20 } }] },
        {
          name: 'multiselect',
          value: [{ value: 'apple_id' }, { value: 'banana_id' }],
        },
        { name: 'select', value: [{ value: 'apple_id' }] },
        { name: 'text_rel', value: [{ value: 'B1' }] },
        { name: 'image', value: [{ value: 'https://example.com/image.jpg' }] },
        { name: 'attached_image_1', value: [{ attachment: 0 }] },
        { name: 'attached_image_2', value: [{ attachment: 1 }] },
        { name: 'media', value: [{ value: 'https://example.com/media.mp4' }] },
        {
          name: 'attached_media_1',
          value: [{ attachment: 2, timeLinks: '{"timelinks":{"00:00:00":"title"}}' }],
        },
        { name: 'attached_media_2', value: [{ attachment: 3 }] },
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
      icon: { id: 'iconId', label: 'iconLabel', type: 'iconType' },
    });

    const entities = await testingEnvironment.db
      .getCollection('entities')
      ?.find({ sharedId: entity.sharedId })
      .toArray();

    const attachments = await testingEnvironment.db
      .getCollection('files')
      ?.find({ type: 'attachment' })
      .toArray();

    const commonFields = {
      template: factory.id('Document'),
      sharedId: expect.any(String),
      title: 'My entity title',
      creationDate: expect.any(Number),
      editDate: expect.any(Number),
      published: false,
      user: null,
      icon: { _id: 'iconId', label: 'iconLabel', type: 'iconType' },
      obsoleteMetadata: [],
      permissions: [],
      metadata: {
        text: [{ value: 'Some text' }],
        numeric: [{ value: 42 }],
        markdown: [{ value: 'Some **markdown**' }],
        generatedid: [{ value: 'CPW6528-7568' }],
        date: [{ value: 1761576489 }],
        multidate: [{ value: 1761576489 }, { value: 1761576489 }],
        daterange: [{ value: { from: 1761576489, to: 1761576489 } }],
        multidaterange: [
          { value: { from: 1761576489, to: 1761576490 } },
          { value: { from: 1761576489, to: 1761576490 } },
        ],
        link: [{ value: { url: 'https://uwazi.io', label: 'Uwazi' } }],
        image: [{ value: 'https://example.com/image.jpg' }],
        attached_image_1: [{ value: '/api/files/1762280821775nhs3epb55g7.png' }],
        attached_image_2: [{ value: '/api/files/1162280821775nhs3epb55g7.png' }],
        geolocation_geolocation: [{ value: { lat: 10, lon: 20 } }],
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
        preview: [],
        media: [{ value: 'https://example.com/media.mp4' }],
        attached_media_1: [
          { value: '(/api/files/attachment_3.mp4, {"timelinks":{"00:00:00":"title"}})' },
        ],
        attached_media_2: [{ value: '/api/files/attachment_4.mp4' }],
      },
    };

    expect(entities).toEqual([
      {
        ...commonFields,
        _id: expect.any(ObjectId),
        language: 'en',

        metadata: {
          ...commonFields.metadata,
          select: [{ value: 'apple_id', label: 'Apple in English' }],
          multiselect: [
            { value: 'apple_id', label: 'Apple in English' },
            { value: 'banana_id', label: 'Banana in English' },
          ],
          text_rel: [
            {
              value: 'B1',
              label: 'B1 EN',
              icon: null,
              type: 'entity',
              inheritedType: 'text',
              inheritedValue: [{ value: 'B1 Text EN' }],
            },
          ],
        },
      },
      {
        ...commonFields,
        _id: expect.any(ObjectId),
        language: 'es',
        metadata: {
          ...commonFields.metadata,
          select: [{ value: 'apple_id', label: 'Apple in Spanish' }],
          multiselect: [
            { value: 'apple_id', label: 'Apple in Spanish' },
            { value: 'banana_id', label: 'Banana in Spanish' },
          ],
          text_rel: [
            {
              value: 'B1',
              label: 'B1 ES',
              icon: null,
              type: 'entity',
              inheritedType: 'text',
              inheritedValue: [{ value: 'B1 Text ES' }],
            },
          ],
        },
      },
    ]);

    expect(entities![0]._id.toHexString()).not.toEqual(entities![1]._id.toHexString());

    expect(attachments).toHaveLength(4);
    expect(attachments).toEqual([
      {
        _id: expect.any(ObjectId),
        creationDate: expect.any(Number),
        entity: expect.any(String),
        originalname: 'Attachment 1.png',
        filename: '1762280821775nhs3epb55g7.png',
        mimetype: 'image/png',
        size: 78636,
        url: '',
        type: 'attachment',
      },
      {
        _id: expect.any(ObjectId),
        creationDate: expect.any(Number),
        entity: expect.any(String),
        originalname: 'Attachment 2.png',
        filename: '1162280821775nhs3epb55g7.png',
        mimetype: 'image/png',
        size: 78636,
        url: '',
        type: 'attachment',
      },
      {
        _id: expect.any(ObjectId),
        creationDate: expect.any(Number),
        entity: expect.any(String),
        originalname: 'Attachment 3.mp4',
        filename: 'attachment_3.mp4',
        mimetype: 'video/mp4',
        size: 78636,
        url: '',
        type: 'attachment',
      },
      {
        _id: expect.any(ObjectId),
        creationDate: expect.any(Number),
        entity: expect.any(String),
        originalname: 'Attachment 4.mp4',
        filename: 'attachment_4.mp4',
        mimetype: 'video/mp4',
        size: 78636,
        url: '',
        type: 'attachment',
      },
    ]);

    expect(filesStorage.storeFile).toHaveBeenCalledTimes(4);
  });

  it('should add grant access when actor is present', async () => {
    const { sut } = createSut({
      context: {
        actor: {
          _id: factory.id('user1'),
          username: 'username',
          email: 'email@email.com',
          role: 'collaborator',
        },
        tenant: tenants.current(),
      },
    });

    const entity = await sut.execute({
      templateId: factory.id('Document').toHexString(),
      propertyAssignments: [{ name: 'title', value: [{ value: 'My entity title' }] }],
      attachments: [],
    });

    const entities = await testingEnvironment.db
      .getCollection('entities')
      ?.find({ sharedId: entity.sharedId })
      .toArray();

    expect(entities?.map(e => e.user)).toEqual([factory.id('user1'), factory.id('user1')]);
    expect(entities?.map(e => e.permissions)).toEqual([
      [
        {
          refId: factory.id('user1').toHexString(),
          type: PermissionType.User,
          level: AccessLevel.Write,
        },
      ],
      [
        {
          refId: factory.id('user1').toHexString(),
          type: PermissionType.User,
          level: AccessLevel.Write,
        },
      ],
    ]);
  });
});
