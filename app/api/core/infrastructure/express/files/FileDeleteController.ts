import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { FileDelete } from '#api/core/application/FileDelete.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { DeleteFileFromStorageJobHandler } from '#api/core/infrastructure/jobs/DeleteFileFromStorageJobHandler.js';
import { MongoEntityPermissionChecker } from '#api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';

class FileDeleteController extends AbstractController {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    try {
      const startTime = Date.now();

      const output = await this.useCase().execute(
        FileDelete.InputSchema.parse({ fileId: this.request.query._id })
      );

      logger.info('File delete executed successfully', {
        namespace: 'File_Delete',
        success: true,
        durationMs: Date.now() - startTime,
      });

      this.response.json([output]);
    } catch (error: unknown) {
      logger.info(
        `File delete execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'File_Delete',
          success: false,

          dto: JSON.stringify(this.request?.query || {}),
          error: JSON.stringify(error),
        }
      );

      throw error;
    }
  }

  private useCase() {
    let transactionManager = TransactionManagerFactory.default();
    let jobsDispatcher: JobsDispatcher = DefaultDispatcher(this.tenantName, transactionManager);
    if (process.env.NODE_ENV === 'test') {
      transactionManager = TransactionManagerFactory.fake();
      jobsDispatcher = new SyncDispatcherForTests({
        DeleteFileFromStorageJobHandler: async () =>
          new DeleteFileFromStorageJobHandler({ fileStorage: FileStorageFactory.default() }),
      });
    }

    return new FileDelete(
      {
        filesDS: FilesDataSourceFactory.default(transactionManager),
        filesService: FilesServiceFactory.default(transactionManager, { jobsDispatcher }),
        entityPermissions: new MongoEntityPermissionChecker(getConnection(), transactionManager),
        transactionManager,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current() }
    );
  }
}

export { FileDeleteController };
