import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
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
    const { transactionManager, mongoTransactionManager } = ExecutionContext;

    const settingsDS = SettingsDataSourceFactory.cached({
      transactionManager,
    });
    const templatesDS = TemplatesDataSourceFactory.cached({
      transactionManager,
    });
    const thesauriDS = ThesauriDataSourceFactory.default({
      transactionManager,
    });
    const translationsDS = TranslationsDataSourceFactory.default({
      transactionManager,
    });
    const entitiesDS = EntitiesDataSourceFactory.default({
      transactionManager,
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
      transactionManager,
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
        transactionManager,
      },
      batchSize
    );
  }
}
