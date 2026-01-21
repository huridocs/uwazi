import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { ObjectId } from 'mongodb';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { TestUtils } from 'api/common.v2/utils/Test';
import { Result } from 'api/core/libs/Result';
import { ThesaurusNameAlreadyExistsError } from 'api/core/domain/thesaurus/errors';
import { ThesauriDataSourceFactory } from 'api/core/infrastructure/factories/ThesauriDataSourceFactory';
import { CreateThesaurusUseCase } from '../CreateThesaurus';
import { ThesaurusTranslationService } from '../thesaurusTranslationService/ThesaurusTranslationService';
import { ThesauriDataSource } from '../contracts/ThesauriDataSource';
import { ThesauriService } from '../ThesauriService';

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

  translationsV2: [],

  dictionaries: [
    factory.thesauri('Fruits', [
      ['apple_id', 'Apple'],
      ['banana_id', 'Banana'],
      ['orange_id', 'Orange'],
    ]),
  ],

  templates: [],

  entities: [],
};

type CreateProps = {
  thesauriDS?: ThesauriDataSource;
  thesaurusTranslationService?: ThesaurusTranslationService;
};

const createSut = (props?: CreateProps) => {
  const transactionManager = TransactionManagerFactory.default();

  const thesauriDS = props?.thesauriDS ?? ThesauriDataSourceFactory.default(transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const thesaurusTranslationService =
    props?.thesaurusTranslationService ??
    new ThesaurusTranslationService({
      settingsDS,
      translationsDS,
    });

  const thesauriService = new ThesauriService({
    thesauriDS,
    thesaurusTranslationService,
  });

  const sut = new CreateThesaurusUseCase({
    transactionManager,
    thesauriService,
  });

  return { sut };
};

describe('CreateThesaurusUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a new thesaurus', async () => {
    const { sut } = createSut();

    await sut.execute({
      name: 'Vegetables',
      values: [{ label: 'Carrot' }, { label: 'Broccoli' }],
    });

    const thesauri = await testingEnvironment.db.getAllFrom('dictionaries');

    expect(thesauri).toHaveLength(2);

    expect(thesauri[1]).toEqual({
      _id: expect.any(ObjectId),
      name: 'Vegetables',
      values: [
        { id: expect.any(String), label: 'Carrot' },
        { id: expect.any(String), label: 'Broccoli' },
      ],
    });
  });

  it('should create translations for the new thesaurus', async () => {
    const { sut } = createSut();

    const output = await sut.execute({
      name: 'Vehicles',
      values: [{ label: 'Car' }, { label: 'Bike' }],
    });

    const translations = await testingEnvironment.db.getAllFrom('translationsV2');

    expect(translations).toEqual(
      TestUtils.arrayIncludesObjects([
        {
          _id: expect.any(ObjectId),
          key: 'Vehicles',
          value: 'Vehicles',
          language: 'en',
          context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
        },
        {
          _id: expect.any(ObjectId),
          key: 'Car',
          value: 'Car',
          language: 'en',
          context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
        },
        {
          _id: expect.any(ObjectId),
          key: 'Bike',
          value: 'Bike',
          language: 'en',
          context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
        },

        {
          _id: expect.any(ObjectId),
          key: 'Vehicles',
          value: 'Vehicles',
          language: 'es',
          context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
        },
        {
          _id: expect.any(ObjectId),
          key: 'Car',
          value: 'Car',
          language: 'es',
          context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
        },
        {
          _id: expect.any(ObjectId),
          key: 'Bike',
          value: 'Bike',
          language: 'es',
          context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
        },
      ])
    );
  });

  it('should revert when creating the thesaurus fails', async () => {
    const thesauriDS = TestUtils.mockClass<ThesauriDataSource>({
      create: jest.fn().mockRejectedValue(new Error('Creation failed')),
      exists: jest.fn().mockResolvedValue(Result.ok(false)),
    });

    const { sut } = createSut({ thesauriDS });

    const before = await testingEnvironment.db.getAllFrom('translationsV2');

    await expect(
      sut.execute({
        name: 'Animals',
        values: [{ label: 'Dog' }, { label: 'Cat' }],
      })
    ).rejects.toThrowError('Creation failed');

    const after = await testingEnvironment.db.getAllFrom('translationsV2');

    expect(after).toEqual(before);
  });

  it('should revert when creating the translations fails', async () => {
    const thesaurusTranslationService = TestUtils.mockClass<ThesaurusTranslationService>({
      create: jest.fn().mockRejectedValue(new Error('Creation failed')),
    });

    const { sut } = createSut({ thesaurusTranslationService });

    const before = await testingEnvironment.db.getAllFrom('dictionaries');

    await expect(
      sut.execute({
        name: 'Animals',
        values: [{ label: 'Dog' }, { label: 'Cat' }],
      })
    ).rejects.toThrowError('Creation failed');

    const after = await testingEnvironment.db.getAllFrom('dictionaries');

    expect(after).toEqual(before);
  });

  it('should not allow creating a thesaurus with an existing name', async () => {
    const { sut } = createSut();

    const before = await testingEnvironment.db.getAllFrom('dictionaries');

    await expect(
      sut.execute({
        name: 'Fruits',
        values: [{ label: 'Strawberry' }],
      })
    ).rejects.toEqual(new ThesaurusNameAlreadyExistsError('Fruits'));

    const after = await testingEnvironment.db.getAllFrom('dictionaries');

    expect(after).toEqual(before);
  });
});
