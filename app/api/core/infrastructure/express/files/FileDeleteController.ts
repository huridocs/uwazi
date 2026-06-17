import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { FileDelete } from '#api/core/application/FileDelete.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { DeleteFileUseCaseFactory } from '../../factories/DeleteFileUseCaseFactory.js';
import { FilesServiceFactory } from '../../factories/FilesServiceFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { FileStorageFactory } from '../../files/FileStorageFactory.js';
import { DeleteFileFromStorageJobHandler } from '../../jobs/DeleteFileFromStorageJobHandler.js';
import { DispatcherAdapter } from '../../jobs/DispatcherAdapter.js';

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
    const { transactionManager } = ExecutionContext;
    let jobsDispatcher: Dispatcher = new DispatcherAdapter(
      DefaultDispatcher(this.tenantName, transactionManager)
    );
    if (process.env.NODE_ENV === 'test') {
      jobsDispatcher = new DispatcherAdapter(
        new SyncDispatcherForTests({
          DeleteFileFromStorageJobHandler: async () =>
            new DeleteFileFromStorageJobHandler({ fileStorage: FileStorageFactory.default() }),
        })
      );
    }

    return DeleteFileUseCaseFactory.default({
      filesService: FilesServiceFactory.default({ jobsDispatcher }),
    });
  }
}

export { FileDeleteController };
