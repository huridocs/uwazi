// import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { CreateTranslations, MongoTranslationsDataSource } from '../CreateTranslations';

// const factory = getFixturesFactory();

const collectionInDb = (collection = 'translations_v2') =>
  testingDB.mongodb?.collection(collection)!;

// const validateAccessMock = jest.fn().mockResolvedValue(undefined);

// const authServiceMock = partialImplementation<AuthorizationService>({
//   validateAccess: validateAccessMock,
// });
//

interface TranslationDBO {
  _id: ObjectId;
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: { type: string; label: string; id: string };
}

interface CreateTranslationsData {
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: { type: string; label: string; id: string };
}

class Translation {
  readonly _id: string;

  readonly key: string;

  readonly value: string;

  readonly language: string;

  readonly context: { type: string; label: string; id: string };

  constructor(
    _id: string,
    key: string,
    value: string,
    language: string,
    context: { type: string; label: string; id: string }
  ) {
    this._id = _id;
    this.key = key;
    this.value = value;
    this.language = language;
    this.context = context;
  }
}

const TranslationMapper = {
  toDBO(translation: Translation): TranslationDBO {
    return {
      _id: new ObjectId(translation._id),
      key: translation.key,
      value: translation.value,
      language: translation.language,
      context: translation.context,
    };
  },

  // toModel(translation: TranslationDBO) {
  //   return new Translation(
  //     translation._id.toHexString(),
  //     mapPointerToModel(translation.from),
  //     mapPointerToModel(translation.to),
  //     translation.type.toHexString()
  //   );
  // },
};

const createService = () =>
  new CreateTranslations(
    new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
    new MongoTransactionManager(getClient()),
    MongoIdGenerator
  );

const fixtures = {
  translations_v2: [],
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('create()', () => {
  describe('When the input is correct', () => {
    it('should persist new connections', async () => {
      const service = createService();
      await service.create([
        {
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
      ]);

      const translationsInDb = await collectionInDb().find({}).sort({ _id: 1 }).toArray();

      expect(translationsInDb).toEqual([
        {
          _id: expect.any(ObjectId),
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
      ]);
    });
  });
});
