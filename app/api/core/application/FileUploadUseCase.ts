import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Document } from 'api/files.v2/model/Document';
import { AbstractUseCase } from '../libs/UseCase';

type Input = {
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
  };
  entityId: string;
};

type Output = Document;

type Deps = {
  filesDS: FilesDataSource;
};

class FileUploadUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync(input: Input): Promise<Output> {
    const document = new Document('id', input.entityId, 5, input.file.filename, 'en');

    await this.transactionManager.run(async () => {
      this.deps.filesDS.insert(document);
    });

    return {};
  }
}

export { FileUploadUseCase };
export type { Input as CreateEntityUseCaseInput };

