import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants/tenantContext';

import { ThesauriDataSourceFactory } from 'api/core/infrastructure/factories/ThesauriDataSourceFactory';
import { EntitiesServiceFactory } from 'api/core/infrastructure/factories/EntitiesServiceFactory';
import { PXCreateParagraphs } from '../application/PXCreateParagraphs';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

export class PXCreateParagraphsFactory {
  static createDefault(batchSize?: number) {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();

    const settingsDS = SettingsDataSourceFactory.cached(mongoTransactionManager);
    const templatesDS = TemplatesDataSourceFactory.cached(mongoTransactionManager);
    const thesauriDS = ThesauriDataSourceFactory.default(mongoTransactionManager);
    const translationsDS = DefaultTranslationsDataSource(mongoTransactionManager);
    const entitiesDS = new MongoMultiLanguageEntityDataSource(connection, mongoTransactionManager);
    const jobsDispatcher = DefaultDispatcher(tenant.name, mongoTransactionManager);

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
