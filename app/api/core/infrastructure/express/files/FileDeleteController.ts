import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { FileDelete } from 'api/core/application/FileDelete';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { SyncDispatcherForTests } from 'api/core/libs/queue/infrastructure/SyncDispatcherForTests';
import { FilesDataSourceFactory } from '../../factories/FilesDataSourceFactory';
import { FilesServiceFactory } from '../../factories/FilesServiceFactory';
import { LoggerFactory } from '../../factories/LoggerFactory';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { FileStorageFactory } from '../../files/FileStorageFactory';
import { DeleteFileFromStorageJobHandler } from '../../jobs/DeleteFileFromStorageJobHandler';

class FileDeleteController extends AbstractController {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    try {
      const startTime = Date.now();

      this.response.json(
        await this.useCase().execute(
          FileDelete.inputSchema.parse({ fileId: this.request.query._id })
        )
      );

      logger.info('File delete executed successfully', {
        namespace: 'File_Delete',
        success: true,
        durationMs: Date.now() - startTime,
      });
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

    return new FileDelete({
      filesDS: FilesDataSourceFactory.default(transactionManager),
      filesService: FilesServiceFactory.default(transactionManager, { jobsDispatcher }),
      transactionManager,
    });
  }
}

export { FileDeleteController };
