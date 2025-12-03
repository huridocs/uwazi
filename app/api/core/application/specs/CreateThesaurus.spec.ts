import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoThesauriDataSourceV2 } from 'api/core/infrastructure/mongodb/thesauri/MongoThesaurusDataSourceV2';
import { ObjectId } from 'mongodb';
import { CreateThesaurusUseCase } from '../CreateThesaurus';

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

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();

  const thesauriDS = new MongoThesauriDataSourceV2(getConnection(), transactionManager);

  const sut = new CreateThesaurusUseCase({
    thesauriDS,
  });

  return { sut };
};

describe('CreateEntityUseCase', () => {
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

    expect(translations).toEqual([
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
    ]);
  });

  it('should not allow creating a thesaurus with an existing name', async () => {
    const { sut } = createSut();

    const before = await testingEnvironment.db.getAllFrom('dictionaries');

    await expect(
      sut.execute({
        name: 'Fruits',
        values: [{ label: 'Strawberry' }],
      })
    ).rejects.toThrowError('Thesaurus with name "Fruits" already exists.');

    const after = await testingEnvironment.db.getAllFrom('dictionaries');

    expect(after).toEqual(before);
  });
});
