import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';

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
};

interface TranslationDBO {
  _id: ObjectId;
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: { type: string; label: string; id: string };
}

export class MongoTranslationsDataSource extends MongoDataSource<TranslationDBO> {
  protected collectionName = 'translations_v2';

  async insert(translations: Translation[]): Promise<Translation[]> {
    const items = translations.map(translation => TranslationMapper.toDBO(translation));
    await this.getCollection().insertMany(items, {
      session: this.getSession(),
    });

    return translations;
  }
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

interface CreateTranslationsData {
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: { type: string; label: string; id: string };
}

export class CreateTranslations {
  private translationsDS: MongoTranslationsDataSource;

  private transactionManager: TransactionManager;

  private idGenerator: IdGenerator;

  constructor(
    translationsDS: MongoTranslationsDataSource, // this should be a contract / interface
    transactionManager: TransactionManager,
    idGenerator: IdGenerator
  ) {
    this.translationsDS = translationsDS;
    this.transactionManager = transactionManager;
    this.idGenerator = idGenerator;
  }

  async create(translations: CreateTranslationsData[]) {
    await this.transactionManager.run(async () =>
      this.translationsDS.insert(
        translations.map(
          translation =>
            new Translation(
              this.idGenerator.generate(),
              translation.key,
              translation.value,
              translation.language,
              translation.context
            )
        )
      )
    );
  }
}
