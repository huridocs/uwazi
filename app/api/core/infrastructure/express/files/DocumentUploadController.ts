import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { FileUploadUseCaseFactory } from '../../factories/FileUploadUseCaseFactory';
import { FileUploadUseCase } from 'api/core/application/FileUploadUseCase';

class DocumentUploadController extends AbstractController {
  protected async handle(): Promise<void> {
    const input = FileUploadUseCase.inputSchema.parse({
      uploadedFile: this.request.inputFile,
      entityId: this.request.body.entity,
    });

    this.response.json(await FileUploadUseCaseFactory.default().execute(input));
  }
}

export { DocumentUploadController };
