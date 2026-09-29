import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';

import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { PXCreateParagraphs } from '../application/PXCreateParagraphs.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

export class PXCreateParagraphsFactory {
  static createDefault(batchSize?: number) {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.mongo();

    const settingsDS = SettingsDataSourceFactory.cached({
      transactionManager: mongoTransactionManager,
    });
    const templatesDS = TemplatesDataSourceFactory.cached({
      transactionManager: mongoTransactionManager,
    });
    const thesauriDS = ThesauriDataSourceFactory.default({
      transactionManager: mongoTransactionManager,
    });
    const translationsDS = TranslationsDataSourceFactory.default({
      transactionManager: mongoTransactionManager,
    });
    const entitiesDS = EntitiesDataSourceFactory.default({
      transactionManager: mongoTransactionManager,
    });
    const jobsDispatcher = DispatcherFactory.default();

    const propertyAssignmentStrategy = PropertyAssignmentCreatorServiceStrategy.create({
      entitiesDS,
      settingsDS,
      thesauriDS,
      translationsDS,
    });

    const entitiesService = EntitiesServiceFactory.default({
      templatesDS,
      entitiesDS,
      eventBus: applicationEventsBus,
      settingsDS,
      transactionManager: mongoTransactionManager,
      dispatcher: jobsDispatcher,
    });

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    return new PXCreateParagraphs(
      {
        entitiesDS,
        extractorsDS,
        entitiesStatusDS,
        entitiesService,
        propertyAssignmentStrategy,
        transactionManager: mongoTransactionManager,
      },
      batchSize
    );
  }
}
