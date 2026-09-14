import { UpdateEntriesByContextUseCase } from '#api/core/application/UpdateEntriesByContext.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PropagateThesaurusTranslationServiceFactory } from './PropagateThesaurusTranslationServiceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

export class UpdateEntriesByContextUseCaseFactory {
  static default() {
    const { transactionManager } = ExecutionContext;

    return new UpdateEntriesByContextUseCase({
      transactionManager,
      settingsDS: SettingsDataSourceFactory.default(),
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      propagateThesaurusTranslation: PropagateThesaurusTranslationServiceFactory.default(),
    });
  }
}
