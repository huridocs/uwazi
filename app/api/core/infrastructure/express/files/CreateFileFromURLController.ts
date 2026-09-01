import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CreateFileFromURLUseCaseFactory } from '../../factories/CreateFileFromURLUseCaseFactory.js';
import { FileMappers } from '../../mongodb/files/FilesMappers.js';

const RequestSchema = z.object({
  url: z.string().url(),
  entity: z.string().min(1),
  originalname: z.string().optional(),
});

class CreateFileFromURLController extends AbstractController {
  protected async handle(): Promise<void> {
    const request = RequestSchema.parse(this.request.body);

    const output = await CreateFileFromURLUseCaseFactory.default().execute({
      url: request.url,
      entityId: request.entity,
      originalname: request.originalname,
    });

    this.response.json(FileMappers.toDBO(output));
  }
}

export { CreateFileFromURLController };
