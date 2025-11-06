/* eslint-disable max-statements */
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { Document } from 'api/files.v2/model/Document';
import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { AbstractUseCase } from '../libs/UseCase';
import { PDFService } from './contracts/PDFService';

type Input = {
  documentId: string;
};

type Output = any;

type Deps = {
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  pdfService: PDFService;
};

export class PDFPostProcess extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync({ documentId }: Input): Promise<Output> {
    const document = this.deps.filesDS.getById(documentId) as Document;
    const fileContents = await this.deps.fileStorage.getFile({
      type: 'document',
      filename: document.filename,
    });

    const pdfInfo = await this.deps.pdfService.extractText(fileContents);

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.update(ProcessedDocument.fromDocument(document, pdfInfo));
    });
  }
}
