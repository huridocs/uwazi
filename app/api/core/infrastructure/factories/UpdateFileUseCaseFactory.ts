import { UpdateFile, UpdateFileDeps, UpdateFileInput } from '#api/core/application/UpdateFile.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { FilesDataSourceFactory } from './FilesDataSourceFactory.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';

class UpdateFileUseCaseFactory {
  static default(overrides?: Partial<UpdateFileDeps>) {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new UpdateFile(
      {
        filesDS: FilesDataSourceFactory.default(),
        filesService: FilesServiceFactory.default(),
        entityPermissions: new MongoEntityPermissionChecker(getConnection(), transactionManager),
        transactionManager,
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );
  }
}

export { UpdateFileUseCaseFactory };
