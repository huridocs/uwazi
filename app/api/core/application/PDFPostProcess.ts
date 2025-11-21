/* eslint-disable max-statements */
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { ProcessingFileFailed } from 'api/files.v2/model/errors';
import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { FileContentsIO } from '../infrastructure/files/FileContentIO';
import { FileIsNotAPDF } from '../infrastructure/services/PDFService';
import { AbstractUseCase } from '../libs/UseCase';
import { PDFService } from './contracts/PDFService';
import { FilesService } from './FilesService';

type Input = {
  documentId: string;
};

type Output = ProcessedDocument;

type Deps = {
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  pdfService: PDFService;
  filesIO: FileContentsIO;
  filesService: FilesService;
};

export class PDFPostProcess extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync({ documentId }: Input, retriesLeft: boolean): Promise<Output> {
    const document = (await this.deps.filesDS.getProcessingById(documentId)).getDataOrThrow();
    try {
      const pdfInfo = (await this.deps.pdfService.extractText(document.content)).getDataOrThrow();

      const processedDoc = ProcessedDocument.fromDocument(document, {
        language: pdfInfo.language.key,
        totalPages: pdfInfo.totalPages,
        fullText: pdfInfo.pages,
      });

      const thumbnail = (
        await this.deps.filesService.createThumbnail(processedDoc, pdfInfo.language.key)
      ).getDataOrThrow();

      await this.transactionManager.run(async () => {
        await this.deps.filesDS.update(processedDoc);

        await this.deps.filesDS.create(thumbnail);
        await this.deps.fileStorage.storeFile(thumbnail);
      });

      return processedDoc;
    } catch (e) {
      if (!retriesLeft || e instanceof FileIsNotAPDF) {
        await this.transactionManager.run(async () => {
          document.failed();
          await this.deps.filesDS.update(document);
        });
      }
      throw new ProcessingFileFailed(document, e);
    }
  }
}
