import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteFileDeps, FileDelete } from '#api/core/application/FileDelete.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { FilesDataSourceFactory } from './FilesDataSourceFactory.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

export class DeleteFileUseCaseFactory {
  static default(overrides?: Partial<DeleteFileDeps>) {
    const useCase = new FileDelete(
      {
        transactionManager: ExecutionContext.transactionManager,
        filesDS: FilesDataSourceFactory.default(),
        entitiesDS: EntitiesDataSourceFactory.default(),
        settingsDS: SettingsDataSourceFactory.default(),
        filesService: FilesServiceFactory.default(),
        entityPermissions: new MongoEntityPermissionChecker(
          getConnection(),
          ExecutionContext.transactionManager
        ),
        entitiesService: EntitiesServiceFactory.default(),
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );

    return useCase;
  }
}
