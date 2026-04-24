import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { FileDelete } from '#api/core/application/FileDelete.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { DispatcherAdapter } from '../../jobs/DispatcherAdapter.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { FilesDataSourceFactory } from '../../factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '../../factories/FilesServiceFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { FileStorageFactory } from '../../files/FileStorageFactory.js';
import { DeleteFileFromStorageJobHandler } from '../../jobs/DeleteFileFromStorageJobHandler.js';
import { MongoEntityPermissionChecker } from '../../mongodb/entity/MongoEntityPermissionChecker.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { EntitiesDataSourceFactory } from '../../factories/EntitiesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '../../factories/SettingsDataSourceFactory.js';

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
    let jobsDispatcher: Dispatcher = new DispatcherAdapter(
      DefaultDispatcher(this.tenantName, transactionManager)
    );
    if (process.env.NODE_ENV === 'test') {
      transactionManager = TransactionManagerFactory.fake();
      jobsDispatcher = new DispatcherAdapter(
        new SyncDispatcherForTests({
          DeleteFileFromStorageJobHandler: async () =>
            new DeleteFileFromStorageJobHandler({ fileStorage: FileStorageFactory.default() }),
        })
      );
    }

    return new FileDelete(
      {
        filesDS: FilesDataSourceFactory.default(transactionManager),
        filesService: FilesServiceFactory.default(transactionManager, { jobsDispatcher }),
        entityPermissions: new MongoEntityPermissionChecker(getConnection(), transactionManager),
        entitiesDS: EntitiesDataSourceFactory.default(transactionManager),
        settingsDS: SettingsDataSourceFactory.default(transactionManager),
        transactionManager,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current() }
    );
  }
}

export { FileDeleteController };
