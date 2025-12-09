import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { FileUploadUseCase } from 'api/core/application/FileUploadUseCase';
import { FileUploadUseCaseFactory } from '../../factories/FileUploadUseCaseFactory';
import { LoggerFactory } from '../../factories/LoggerFactory';

class DocumentUploadController extends AbstractController {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    try {
      const startTime = Date.now();
      const input = FileUploadUseCase.inputSchema.parse({
        uploadedFile: this.request.inputFile,
        entityId: this.request.body.entity,
      });

      this.response.json(await FileUploadUseCaseFactory.default().execute(input));

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
}

export { DocumentUploadController };
