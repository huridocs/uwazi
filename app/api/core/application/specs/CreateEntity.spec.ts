import { ObjectId } from 'mongodb';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { CreateEntityUseCaseFactory } from '#api/core/infrastructure/factories/CreateEntityUseCaseFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { User } from '#api/users.v2/model/User.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

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

    factory.template('Document With Required', [
      factory.property('required_text', 'text', { required: true }),
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
  actor?: User;
  targetLanguage?: LanguageISO6391;
};

const createSut = (props: CreateSutProps = {}) => {
  const actor =
    props.actor ??
    User.createFrom({
      _id: new ObjectId(),
      role: 'admin',
      groups: [],
      email: '',
      username: '',
    });

  const { sut, fileService } = testingEnvironment.runWithContext(
    () => {
      const fileStorage = TestUtils.mockClass<FileSystemStorage>({ storeFile: jest.fn() });
      const _fileService = FilesServiceFactory.default({ fileStorage });
      jest.spyOn(_fileService, 'storeFiles').mockResolvedValue();
      jest.spyOn(_fileService, 'insert').mockResolvedValue();

      return {
        sut: CreateEntityUseCaseFactory.default({
          targetLanguage: props.targetLanguage ?? 'en',
          fileService: _fileService,
        }),
        fileService: _fileService,
      };
    },
    { actor }
  );

  return { sut, fileService };
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
    const actor = User.createFrom({
      _id: factory.id('user1').toString(),
      username: 'username',
      email: 'email@email.com',
      role: 'collaborator',
    });

    const { sut, fileService } = createSut({ actor, targetLanguage: 'en' });

    const entity = await sut.execute({
      templateId: factory.id('Document').toHexString(),
      inputFiles: [
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
            fieldname: 'documents[0]',
            encoding: '7bit',
            mimetype: 'image/png',
            destination: '/tmp',
            originalname: 'primary.pdf',
            filename: '1162280821775nhs3epb55g7.png',
            path: '/tmp/1162280821775nhs3epb55g7.png',
            size: 78636,
          },
          'document'
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

        InputFile.createUrlAttachment({
          originalname: 'URL_attachment.png',
          url: 'https://example.com/image.svg',
        }),
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

    const commonFields = {
      template: factory.id('Document'),
      sharedId: expect.any(String),
      title: 'My entity title',
      creationDate: expect.any(Number),
      editDate: expect.any(Number),
      icon: { _id: 'iconId', label: 'iconLabel', type: 'iconType' },
      obsoleteMetadata: [],
      user: factory.id('user1'),
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
              type: 'entity',
              inheritedType: 'text',
              inheritedValue: [{ value: 'B1 Text ES' }],
            },
          ],
        },
      },
    ]);

    expect(entities![0]._id.toHexString()).not.toEqual(entities![1]._id.toHexString());

    expect(fileService.storeFiles).toHaveBeenCalledWith([
      expect.objectContaining({ originalname: 'Attachment 1.png' }),
      expect.objectContaining({ originalname: 'primary.pdf' }),
      expect.objectContaining({ originalname: 'Attachment 2.png' }),
      expect.objectContaining({ originalname: 'Attachment 3.mp4' }),
      expect.objectContaining({ originalname: 'Attachment 4.mp4' }),
      expect.objectContaining({ originalname: 'URL_attachment.png' }),
    ]);

    expect(fileService.insert).toHaveBeenCalledWith([
      expect.objectContaining({ originalname: 'Attachment 1.png' }),
      expect.objectContaining({ originalname: 'primary.pdf' }),
      expect.objectContaining({ originalname: 'Attachment 2.png' }),
      expect.objectContaining({ originalname: 'Attachment 3.mp4' }),
      expect.objectContaining({ originalname: 'Attachment 4.mp4' }),
      expect.objectContaining({ originalname: 'URL_attachment.png' }),
    ]);
  });

  it('should emit EntityCreatedEvent with request target language', async () => {
    const actor = User.createFrom({
      _id: factory.id('user1'),
      username: 'username',
      email: 'email@email.com',
      role: 'collaborator',
    });

    const emitSpy = jest.spyOn(applicationEventsBus, 'emit');

    const { sut } = createSut({ actor, targetLanguage: 'es' });

    await sut.execute({
      templateId: factory.id('Document').toHexString(),
      propertyAssignments: [{ name: 'title', value: [{ value: 'My entity title' }] }],
    });

    expect(emitSpy).toHaveBeenCalled();

    const emittedArg = (emitSpy as jest.SpyInstance).mock.calls.find(
      c => c && c[0] && typeof c[0].getData === 'function'
    )?.[0];

    const targetLanguage = emittedArg.getData().targetLanguageKey;
    expect(targetLanguage).toBe('es');
  });

  it('should throw when a required property has no value', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        templateId: factory.id('Document With Required').toHexString(),
        propertyAssignments: [
          { name: 'title', value: [{ value: 'My entity title' }] },
          { name: 'required_text', value: [] },
        ],
      })
    ).rejects.toThrow('Text Property is required');
  });
});
