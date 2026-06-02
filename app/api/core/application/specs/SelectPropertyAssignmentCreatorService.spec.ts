import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { ObjectId } from 'mongodb';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { PropertyNotFoundError } from '#api/core/domain/template/errors.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { SelectPropertyAssignmentCreatorService } from '../propertyAssignmentCreatorService/SelectPropertyAssignmentCreatorService.js';

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

      factory.property('multiselect_grouped', 'multiselect', {
        content: factory.id('GroupedFruits').toHexString(),
      }),

      factory.property('select_grouped', 'select', {
        content: factory.id('GroupedFruits').toHexString(),
      }),

      factory.property('required_select', 'select', {
        content: factory.id('Fruits').toHexString(),
        required: true,
      }),
    ]),
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
  const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

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
        isTranslatable: false,
      },
      {
        name: 'select',
        value: [{ value: 'apple_id', label: 'Apple in Portuguese' }],
        type: 'select',
        language: 'pt',
        isTranslatable: false,
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
        isTranslatable: false,
      },
      {
        name: 'select',
        value: [{ value: 'apple_id', label: 'Apple' }],
        type: 'select',
        language: 'pt',
        isTranslatable: false,
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
        isTranslatable: false,
      },

      {
        language: 'pt',
        name: 'multiselect',
        type: 'multiselect',
        value: [
          { value: 'apple_id', label: 'Apple in Portuguese' },
          { value: 'banana_id', label: 'Banana in Portuguese' },
        ],
        isTranslatable: false,
      },
    ]);
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
        isTranslatable: false,
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
        isTranslatable: false,
      },
    ]);
  });

  it('should create property assignment for a multi select linked to a grouped thesaurus', async () => {
    const { sut } = createSut();

    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const assignments = await sut.create({
      template,
      propertyAssignment: {
        name: 'multiselect_grouped',
        value: [{ value: 'cherry_id' }, { value: 'grape_id' }],
      },
    });

    expect(assignments).toEqual([
      {
        name: 'multiselect_grouped',
        value: [
          {
            value: 'cherry_id',
            label: 'Cherry in English',
            parent: { value: 'red_id', label: 'Red in English' },
          },
          {
            value: 'grape_id',
            label: 'Grape in English',
          },
        ],
        type: 'multiselect',
        language: 'en',
        isTranslatable: false,
      },
      {
        name: 'multiselect_grouped',
        value: [
          {
            value: 'cherry_id',
            label: 'Cherry in Portuguese',
            parent: { value: 'red_id', label: 'Red in Portuguese' },
          },
          {
            value: 'grape_id',
            label: 'Grape in Portuguese',
          },
        ],
        type: 'multiselect',
        language: 'pt',
        isTranslatable: false,
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

  it('should filter out values that do not exist in the referenced thesaurus', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const assignments = await sut.create({
      template,
      propertyAssignment: {
        name: 'select',
        value: [{ value: 'apple_id' }, { value: 'INVALID_VALUE' }],
      },
    });

    expect(assignments).toEqual([
      {
        name: 'select',
        value: [{ value: 'apple_id', label: 'Apple' }],
        type: 'select',
        language: 'en',
        isTranslatable: false,
      },
      {
        name: 'select',
        value: [{ value: 'apple_id', label: 'Apple in Portuguese' }],
        type: 'select',
        language: 'pt',
        isTranslatable: false,
      },
    ]);

    const assignmentsGrouped = await sut.create({
      template,
      propertyAssignment: {
        name: 'select_grouped',
        value: [{ value: 'cherry_id' }, { value: 'INVALID_VALUE' }],
      },
    });

    expect(assignmentsGrouped[0].value).toHaveLength(1);
    expect(assignmentsGrouped[0].value[0].value).toBe('cherry_id');
  });

  it('should throw when validateRequired is true and a required select property has no value', async () => {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

    const sut = new SelectPropertyAssignmentCreatorService(
      { thesauriDS, translationsDS, settingsDS },
      { validateRequired: true }
    );

    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'required_select', value: [] },
      })
    ).rejects.toThrow('Select/MultiSelect Property is required');
  });
});
