import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CSVImportEntitiesFactories } from '../factories/CSVImportEntitiesFactories.js';

const RequestSchema = z.object({
  template: z.string(),
});

type RequestBody = z.infer<typeof RequestSchema>;

export class RegisterCsvImportController extends AbstractController<RequestBody> {
  protected async handle(): Promise<void> {
    const { template } = RequestSchema.parse(this.request.body || {});
    if (!this.request.inputFile) throw new Error('File is not available on request object');

    const userId = this.user?._id;
    if (!userId) {
      this.response.status(401).json({ message: 'User not found in request context' });
      return;
    }

    const useCase = CSVImportEntitiesFactories.default();
    const response = await useCase.execute({
      template,
      file: this.request.inputFile,
      userId: userId.toString(),
    });
    this.jsonResponse(response);
  }
}
