import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { FileUploadForEntity } from 'api/core/application/FileUploadForEntity';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { SyncDispatcherForTests } from 'api/core/libs/queue/infrastructure/SyncDispatcherForTests';
import { FilesServiceFactory } from '../../factories/FilesServiceFactory';
import { FileUploadForEntityFactory } from '../../factories/FileUploadForEntityFactory';
import { LoggerFactory } from '../../factories/LoggerFactory';
import { PDFPostProcessJobFactory } from '../../factories/PDFPostProcessJobFactory';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { PDFPostProcessJobHandler } from '../../jobs/PDFPostProcessJobHandler';
import { V1WebSocketsWrapper } from '../../services/V1WebSocketsWrapper';

class DocumentUploadController extends AbstractController {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    try {
      const startTime = Date.now();
      const input = FileUploadForEntity.inputSchema.parse({
        uploadedFile: this.request.inputFile,
        entityId: this.request.body.entity,
      });

      this.response.json(await this.useCase().execute(input));

      logger.info('Document upload executed successfully', {
        namespace: 'Document_Upload',
        success: true,
        durationMs: Date.now() - startTime,
      });
    } catch (error: unknown) {
      logger.info(
        `Document upload execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Document_Upload',
          success: false,

          dto: JSON.stringify({
            uploadedFile: this.request?.inputFile || {},
            entityId: this.request?.body?.entity || {},
          }),
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
        PDFPostProcessJobHandler: async () =>
          new PDFPostProcessJobHandler({
            useCase: PDFPostProcessJobFactory.default(transactionManager),
            wSockets: new V1WebSocketsWrapper(),
          }),
      });
    }

    return FileUploadForEntityFactory.default(transactionManager, {
      filesService: FilesServiceFactory.default(transactionManager, { jobsDispatcher }),
    });
  }
}

export { DocumentUploadController };
