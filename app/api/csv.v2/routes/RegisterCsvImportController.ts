import * as cookie from 'cookie';
import { z } from 'zod';
import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { InputFile } from 'api/files.v2/model/InputFile';
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

    let sessionId: string | undefined;
    try {
      const cookieHeader = this.request.get('cookie') || '';
      const parsed = cookie.parse(cookieHeader);
      sessionId = parsed['connect.sid'];
    } catch {
      // ignore cookie parsing errors
    }

    const useCase = RegisterCsvImportUseCaseFactory();
    const response = await useCase.execute({
      template,
      file: new InputFile(this.request.file, 'document'),
      userId: userId.toString(),
      sessionId,
    });
    this.jsonResponse(response);
  }
}
