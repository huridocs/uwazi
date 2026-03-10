import { Request, Response } from 'express';
import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { CustomFileUpload } from 'api/customUploads/application/CustomFileUpload';
import { CustomFileUploadFactory } from '../factories/CustomFileUploadFactory';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';

class CustomFileUploadController extends AbstractController {
  static createHandler() {
    return async (request: Request, response: Response) => {
      const instance = new CustomFileUploadController({ request, response });
      await instance.handleAsync();
    };
  }

  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    const namespace = 'Custom_Upload';

    try {
      const startTime = Date.now();
      const input = CustomFileUpload.inputSchema.parse({
        uploadedFile: this.request.inputFile,
      });

      this.response.json(await this.useCase().execute(input));

      logger.info('Custom file upload executed successfully', {
        namespace,
        success: true,
        durationMs: Date.now() - startTime,
      });
    } catch (error: unknown) {
      logger.info(
        `Custom file upload execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace,
          success: false,
          dto: JSON.stringify({
            uploadedFile: this.request?.inputFile || {},
          }),
          error: JSON.stringify(error),
        }
      );

      throw error;
    }
  }

  private useCase() {
    const transactionManager =
      process.env.NODE_ENV === 'test'
        ? TransactionManagerFactory.fake()
        : TransactionManagerFactory.default();

    return CustomFileUploadFactory.default(transactionManager);
  }
}

export { CustomFileUploadController };
