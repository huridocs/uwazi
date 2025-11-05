import { z } from 'zod';
import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { RegisterCsvImportUseCaseFactory } from '../services/service_factories';

const RequestSchema = z.object({
  template: z.string(),
});

type RequestBody = z.infer<typeof RequestSchema>;

export class RegisterCsvImportController extends AbstractController<RequestBody> {
  protected async handle(): Promise<void> {
    const { template } = RequestSchema.parse(this.request.body || {});
    if (!this.request.file) throw new Error('File is not available on request object');

    const userId = this.user?._id;
    if (!userId) {
      this.response.status(401).json({ message: 'User not found in request context' });
      return;
    }

    const useCase = RegisterCsvImportUseCaseFactory();
    const response = await useCase.execute({
      template,
      file: {
        path: this.request.file.path,
        originalname: this.request.file.originalname,
        mimetype: this.request.file.mimetype,
        size: this.request.file.size,
      },
      userId: userId.toString(),
    });
    this.jsonResponse(response);
  }
}
