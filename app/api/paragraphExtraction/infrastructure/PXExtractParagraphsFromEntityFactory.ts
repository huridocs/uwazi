import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { MongoIdHandler } from 'api/core/infrastructure/mongodb/common/MongoIdGenerator';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';

import { tenants } from 'api/tenants';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { EntitiesServiceFactory } from 'api/core/infrastructure/factories/EntitiesServiceFactory';
import { EntitiesDataSourceFactory } from 'api/core/infrastructure/factories/EntitiesDataSourceFactory';
import { PXExtractParagraphsFromEntity } from '../application/PXExtractParagraphsFromEntity';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractionServiceFactory } from './PXExtractionServiceFactory';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

export class PXExtractParagraphsFromEntityFactory {
  static createDefault(tenantName: string): PXExtractParagraphsFromEntity {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const entitiesDS = EntitiesDataSourceFactory.default(mongoTransactionManager);

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const extractionService = PXExtractionServiceFactory.createDefault();

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });
    const filesDS = FilesDataSourceFactory.default(mongoTransactionManager);
    const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);
    const fileStorage = FileStorageFactory.default();
    const idGenerator = MongoIdHandler;
    const logger = LoggerFactory.default();

    const entitiesService = EntitiesServiceFactory.default({
      entitiesDS,
      settingsDS,
      transactionManager: mongoTransactionManager,
    });

    const extractParagraphsFromEntity = new PXExtractParagraphsFromEntity(
      {
        entitiesService,
        entitiesDS,
        entitiesStatusDS,
        extractionService,
        extractorsDS,
        filesDS,
        settingsDS,
        fileStorage,
        idGenerator,
        logger,
        tenantName,
      },
      { tenant: tenants.current(), actor: permissionsContext.getUserInContext()! }
    );

    return extractParagraphsFromEntity;
  }
}
