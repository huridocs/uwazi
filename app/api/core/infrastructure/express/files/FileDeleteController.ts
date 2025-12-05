import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { FileDelete } from 'api/core/application/FileDelete';
import { FilesDataSourceFactory } from '../../factories/FilesDataSourceFactory';
import { FilesServiceFactory } from '../../factories/FilesServiceFactory';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { LoggerFactory } from '../../factories/LoggerFactory';

class FileDeleteController extends AbstractController {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    try {
      const startTime = Date.now();
      const transactionManager = TransactionManagerFactory.default();
      const useCase = new FileDelete({
        filesDS: FilesDataSourceFactory.default(transactionManager),
        filesService: FilesServiceFactory.default(transactionManager),
        transactionManager,
      });

      this.response.json(
        await useCase.execute(FileDelete.inputSchema.parse({ fileId: this.request.query._id }))
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
}

export { FileDeleteController };
