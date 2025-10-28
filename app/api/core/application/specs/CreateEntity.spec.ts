import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { UseCaseContext } from 'api/core/libs/UseCase';
import { ObjectId } from 'mongodb';
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

  dictionaries: [factory.thesauri('thesaurus_fruits', ['Apple', 'Banana', 'Orange'])],

  templates: [
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
      factory.property('geolocation_geolocation', 'geolocation'),
      factory.property('select', 'select', {
        content: factory.id('thesaurus_fruits').toHexString(),
      }),
      factory.property('multiselect', 'multiselect', {
        content: factory.id('thesaurus_fruits').toHexString(),
      }),
      factory.property('relationship', 'relationship'),
      factory.property('nested', 'nested'),
      factory.property('preview', 'preview'),
      factory.property('media', 'media'),
    ]),
  ],
};

type CreateSutProps = {
  context?: UseCaseContext;
};

const createSut = (props: CreateSutProps = {}) => {
  const { context } = props;
  const transactionManager = DefaultTransactionManager();
  const idGenerator = DefaultIdGenerator;
  const settingsDS = DefaultSettingsDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);

  const multiLanguageEntityDS = new MongoMultiLanguageEntityDataSource(
    getConnection(),
    transactionManager,
    templatesDS
  );

  const sut = new CreateEntityUseCase(
    {
      transactionManager,
      idGenerator,
      settingsDS,
      multiLanguageEntityDS,
      templatesDS,
    },
    context
  );

  return { sut };
};

describe('CreateEntityUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Entity', async () => {
    const { sut } = createSut();

    await sut.execute({
      templateId: factory.id('Document').toHexString(),
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
        // {
        //   name: 'multiselect',
        //   value: [
        //     { value: factory.id('Apple').toHexString() },
        //     { value: factory.id('Banana').toHexString() },
        //   ],
        // },
        // { name: 'select', value: [{ value: factory.id('Apple').toHexString() }] },
        // { name: 'image', value: [] },
        // { name: 'relationship', value: [] },
      ],
      icon: { id: 'iconId', label: 'iconLabel', type: 'iconType' },
    });

    const entities = await testingEnvironment.db.getAllFrom('entities');

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
        image: [],
        geolocation_geolocation: [{ value: { lat: 10, lon: 20 } }],
        select: [],
        multiselect: [],
        relationship: [],
        media: [],
        nested: [],
        preview: [],
      },
    };

    expect(entities).toEqual([
      {
        _id: expect.any(ObjectId),
        language: 'en',
        ...commonFields,
      },
      {
        _id: expect.any(ObjectId),
        language: 'es',
        ...commonFields,
      },
    ]);

    expect(entities![0]._id.toHexString()).not.toEqual(entities![1]._id.toHexString());
  });
});
