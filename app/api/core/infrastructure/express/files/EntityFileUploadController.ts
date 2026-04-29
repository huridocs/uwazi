import type { Request, Response } from 'express';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { FileUploadForEntity } from '#api/core/application/FileUploadForEntity.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { FilesServiceFactory } from '../../factories/FilesServiceFactory.js';
import { FileUploadForEntityFactory } from '../../factories/FileUploadForEntityFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { PDFPostProcessJobFactory } from '../../factories/PDFPostProcessJobFactory.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { PDFPostProcessJobHandler } from '../../jobs/PDFPostProcessJobHandler.js';
import { V1WebSocketsWrapper } from '../../services/V1WebSocketsWrapper.js';

class EntityFileUploadController extends AbstractController {
  private fileType: 'document' | 'attachment' = 'document';

  /**
   * Creates a handler for document uploads.
   * Documents trigger PDF post-processing and emit socket events.
   */
  static forDocument() {
    return async (request: Request, response: Response) => {
      const instance = new EntityFileUploadController({ request, response });
      instance.fileType = 'document';
      await instance.handleAsync();
    };
  }

  /**
   * Creates a handler for attachment uploads.
   * Attachments do not trigger PDF post-processing.
   */
  static forAttachment() {
    return async (request: Request, response: Response) => {
      const instance = new EntityFileUploadController({ request, response });
      instance.fileType = 'attachment';
      await instance.handleAsync();
    };
  }

  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    const namespace = this.fileType === 'document' ? 'Document_Upload' : 'Attachment_Upload';
    const fileTypeLabel = this.fileType.charAt(0).toUpperCase() + this.fileType.slice(1);

    try {
      const startTime = Date.now();
      const input = FileUploadForEntity.inputSchema.parse({
        uploadedFile: this.request.inputFile,
        entityId: this.request.body.entity,
      });

      this.response.json(await this.useCase().execute(input));

      logger.info(`${fileTypeLabel} upload executed successfully`, {
        namespace,
        success: true,
        durationMs: Date.now() - startTime,
      });
    } catch (error: unknown) {
      logger.info(
        `${fileTypeLabel} upload execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace,
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

    return FileUploadForEntityFactory.default({
      transactionManager,
      filesService: FilesServiceFactory.default({ jobsDispatcher, transactionManager }),
    });
  }
}

export { EntityFileUploadController };
