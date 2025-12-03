import { ThesauriDataSource } from 'api/core/application/contracts/ThesauriDataSource';
import { Result, ResultType } from 'api/core/libs/Result';
import { Thesaurus } from 'api/core/domain/thesaurus/Thesaurus';
import { Db } from 'mongodb';
import { MongoTranslationsDataSource } from 'api/i18n.v2/database/MongoTranslationsDataSource';
import { MongoDataSource } from '../common/MongoDataSource';
import { MongoThesaurusMapper } from './MongoThesaurusMapper';
import { ThesaurusDBO } from './ThesaurusDBO';
import { MongoTransactionManager } from '../common/MongoTransactionManager';
import { MongoThesaurusTranslationService } from './MongoThesaurusTranslationService';
import { MongoSettingsDataSource } from '../MongoSettingsDataSource';

class MongoThesauriDataSourceV2
  extends MongoDataSource<ThesaurusDBO>
  implements ThesauriDataSource
{
  protected collectionName = 'dictionaries';

  private translationService: MongoThesaurusTranslationService;

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
    this.translationService = new MongoThesaurusTranslationService({
      settingsDS: new MongoSettingsDataSource(db, transactionManager),
      translationsDS: new MongoTranslationsDataSource(db, transactionManager),
    });
  }

  async create(thesaurus: Thesaurus): Promise<void> {
    const dbo = MongoThesaurusMapper.toDBO(thesaurus);

    await this.getCollection().insertOne(dbo, { ignoreUndefined: true });
    await this.translationService.create(thesaurus);
  }

  async exists(name: string): Promise<ResultType<false, Error>> {
    const count = await this.getCollection().countDocuments({ name }, { limit: 1 });

    if (count > 0) {
      return Result.fail(new Error(`Thesaurus with name "${name}" already exists.`));
    }

    return Result.ok(false);
  }
}

export { MongoThesauriDataSourceV2 };
