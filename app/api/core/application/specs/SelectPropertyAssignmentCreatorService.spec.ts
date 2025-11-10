import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { ObjectId } from 'mongodb';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { PropertyNotFoundError } from 'api/core/domain/template/errors';
import { SelectPropertyAssignmentCreatorService } from '../propertyAssignmentCreatorService/SelectPropertyAssignmentCreatorService';

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
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
      key: 'Apple',
      language: 'en',
      value: 'Apple',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
      key: 'Banana',
      language: 'en',
      value: 'Banana',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
      key: 'Fruits',
      language: 'en',
      value: 'Fruits',
    },

    {
      _id: new ObjectId(),
      key: 'Apple',
      value: 'Apple in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'Banana',
      value: 'Banana in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'Fruits',
      value: 'Fruits in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
    },

    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Apple (Red)',
      language: 'en',
      value: 'Apple (Red) in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Apple (Red)',
      language: 'pt',
      value: 'Apple (Red) in Portuguese',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Banana',
      language: 'en',
      value: 'Banana in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Banana',
      language: 'pt',
      value: 'Banana in Portuguese',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Cherry',
      language: 'en',
      value: 'Cherry in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Cherry',
      language: 'pt',
      value: 'Cherry in Portuguese',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Grape',
      language: 'en',
      value: 'Grape in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Grape',
      language: 'pt',
      value: 'Grape in Portuguese',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Grouped Fruits',
      language: 'en',
      value: 'Grouped Fruits in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Grouped Fruits',
      language: 'pt',
      value: 'Grouped Fruits in Portuguese',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Red',
      language: 'en',
      value: 'Red in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Grouped Fruits',
        id: factory.id('GroupedFruits').toHexString(),
      },
      key: 'Red',
      language: 'pt',
      value: 'Red in Portuguese',
    },
  ],

  dictionaries: [
    factory.thesauri('Fruits', [
      ['apple_id', 'Apple'],
      ['banana_id', 'Banana'],
    ]),
    {
      _id: factory.id('GroupedFruits'),
      name: 'Grouped Fruits',
      values: [
        {
          id: 'red_id',
          label: 'Red',
          values: [
            { id: 'cherry_id', label: 'Cherry' },
            { id: 'apple_red_id', label: 'Apple (Red)' },
          ],
        },
        { id: 'grape_id', label: 'Grape' },
      ],
    },
  ],

  templates: [
    factory.template('Document', [
      factory.property('select', 'select', {
        content: factory.id('Fruits').toHexString(),
      }),

      factory.property('multiselect', 'multiselect', {
        content: factory.id('Fruits').toHexString(),
      }),

      factory.property('select_grouped', 'select', {
        content: factory.id('GroupedFruits').toHexString(),
      }),
    ]),
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);

  const sut = new SelectPropertyAssignmentCreatorService({
    thesauriDS,
    translationsDS,
    settingsDS,
  });

  return { sut };
};

describe('SelectPropertyAssignmentCreatorService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create one property assignment per language with localized label using translations', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const assignments = await sut.create({
      template,
      propertyAssignment: { name: 'select', value: [{ value: 'apple_id' }] },
    });

    expect(assignments).toEqual([
      {
        name: 'select',
        value: [{ value: 'apple_id', label: 'Apple' }],
        type: 'select',
        language: 'en',
      },
      {
        name: 'select',
        value: [{ value: 'apple_id', label: 'Apple in Portuguese' }],
        type: 'select',
        language: 'pt',
      },
    ]);
  });

  it('should fallback to the base thesaurus label when a translation is missing for a language', async () => {
    await testingEnvironment.setFixtures({
      ...fixtures,
      translationsV2: [
        {
          _id: new ObjectId(),
          context: {
            type: 'Thesaurus',
            label: 'Fruits',
            id: factory.id('Fruits').toHexString(),
          },
          key: 'Apple',
          language: 'en',
          value: 'Apple in English',
        },
        {
          _id: new ObjectId(),
          context: {
            type: 'Thesaurus',
            label: 'Fruits',
            id: factory.id('Fruits').toHexString(),
          },
          key: 'Banana',
          language: 'en',
          value: 'Banana',
        },
        {
          _id: new ObjectId(),
          context: {
            type: 'Thesaurus',
            label: 'Fruits',
            id: factory.id('Fruits').toHexString(),
          },
          key: 'Fruits',
          language: 'en',
          value: 'Fruits',
        },
      ],
    });

    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const assignments = await sut.create({
      template,
      propertyAssignment: { name: 'select', value: [{ value: 'apple_id' }] },
    });

    expect(assignments).toEqual([
      {
        name: 'select',
        value: [{ value: 'apple_id', label: 'Apple in English' }],
        type: 'select',
        language: 'en',
      },
      {
        name: 'select',
        value: [{ value: 'apple_id', label: 'Apple' }],
        type: 'select',
        language: 'pt',
      },
    ]);
  });

  it('should create property assignment for a MultiSelect property', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const assignments = await sut.create({
      template,
      propertyAssignment: {
        name: 'multiselect',
        value: [{ value: 'apple_id' }, { value: 'banana_id' }],
      },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'multiselect',
        type: 'multiselect',
        value: [
          { value: 'apple_id', label: 'Apple' },
          { value: 'banana_id', label: 'Banana' },
        ],
      },

      {
        language: 'pt',
        name: 'multiselect',
        type: 'multiselect',
        value: [
          { value: 'apple_id', label: 'Apple in Portuguese' },
          { value: 'banana_id', label: 'Banana in Portuguese' },
        ],
      },
    ]);
  });

  it('should throw when the provided value does not exist in the referenced thesaurus', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'select', value: [{ value: 'INVALID_VALUE' }] },
      })
    ).rejects.toThrow(
      'The value "INVALID_VALUE" does not exist in the referenced Thesaurus "Fruits"'
    );

    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'select_grouped', value: [{ value: 'INVALID_VALUE' }] },
      })
    ).rejects.toThrow(
      'The value "INVALID_VALUE" does not exist in the referenced Thesaurus "Grouped Fruits"'
    );
  });

  it('should create property assignment for a select linked to a grouped thesaurus', async () => {
    const { sut } = createSut();

    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const assignments = await sut.create({
      template,
      propertyAssignment: { name: 'select_grouped', value: [{ value: 'cherry_id' }] },
    });

    expect(assignments).toEqual([
      {
        name: 'select_grouped',
        value: [
          {
            value: 'cherry_id',
            label: 'Cherry in English',
            parent: { value: 'red_id', label: 'Red in English' },
          },
        ],
        type: 'select',
        language: 'en',
      },
      {
        name: 'select_grouped',
        value: [
          {
            value: 'cherry_id',
            label: 'Cherry in Portuguese',
            parent: { value: 'red_id', label: 'Red in Portuguese' },
          },
        ],
        type: 'select',
        language: 'pt',
      },
    ]);
  });

  it('throws if the property name does not exist in the template', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'non_existent_property', value: [{ value: 'Apple' }] },
      })
    ).rejects.toThrow(PropertyNotFoundError);
  });
});
