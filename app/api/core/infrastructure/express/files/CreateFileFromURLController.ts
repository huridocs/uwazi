import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CreateFileFromURLUseCaseFactory } from '../../factories/CreateFileFromURLUseCaseFactory.js';
import { FileMappers } from '../../mongodb/files/FilesMappers.js';

const RequestSchema = z.object({
  url: z.string().url(),
  entity: z.string().min(1),
  originalname: z.string().optional(),
});

class CreateFileFromURLController extends AbstractController {
  protected async handle(): Promise<void> {
    const start = Date.now();

    try {
      const request = RequestSchema.parse(this.request.body);

      const output = await CreateFileFromURLUseCaseFactory.default().execute({
        url: request.url,
        entityId: request.entity,
        originalname: request.originalname,
      });

      ExecutionContext.logger.info('Create file from URL executed successfully', {
        namespace: 'Create_File_From_URL',
        success: true,
        durationMs: Date.now() - start,
      });

      this.response.json(FileMappers.toDBO(output));
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Create file from URL execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Create_File_From_URL',
          success: false,

          dto: JSON.stringify(this.request?.body || {}),
          error: JSON.stringify(error),
          durationMs: Date.now() - start,
        }
      );

      throw error;
    }
  }
}

export { CreateFileFromURLController };
