import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Document } from 'api/files.v2/model/Document';
import { File } from 'api/files.v2/model/File';
import date from 'api/utils/date';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import path from 'path';
import { AbstractUseCase } from '../libs/UseCase';
import { PDFService } from './contracts/PDFService';

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
  pdfService: PDFService;
};

class FileUploadUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync(input: Input): Promise<Output> {
    const tmpFile = new File({
      filename: input.file.filename,
      source: createReadStream(path.join(input.file.destination, input.file.filename)),
    });
    const pdfInfo = (await this.deps.pdfService.extractText(tmpFile)).getDataOrThrow();

    const document = new Document({
      id: 'should generate',
      entity: input.entityId,
      ...input.file,
      language: pdfInfo.language.key,
      totalPages: pdfInfo.totalPages,
      status: 'processing',
      creationDate: date.currentUTC(),
    });

    await this.transactionManager.run(async () => {
      // this.deps.filesDS.insert(document);
    });

    return document;
  }
}

export { FileUploadUseCase };
export type { Input as CreateEntityUseCaseInput };
