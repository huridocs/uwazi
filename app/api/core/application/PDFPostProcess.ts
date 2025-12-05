/* eslint-disable max-statements */
import { FilesDataSource } from 'api/core/application/contracts/FilesDataSource';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { ProcessingFileFailed } from 'api/core/domain/files/errors';
import { ProcessedDocument } from 'api/core/domain/files/ProcessedDocument';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { FileMappers } from '../infrastructure/mongodb/files/FilesMappers';
import { FileIsNotAPDF } from '../infrastructure/services/PDFService';
import { EventsBus } from '../libs/eventsbus';
import { AbstractUseCase } from '../libs/UseCase';
import { PDFService } from './contracts/PDFService';
import { FilesService } from './FilesService';

type Input = {
  documentId: string;
};

type Output = ProcessedDocument;

type Deps = {
  eventBus: EventsBus;
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  pdfService: PDFService;
  filesService: FilesService;
};

export class PDFPostProcess extends AbstractUseCase<Input, Output, Deps, [boolean]> {
  async execute({ documentId }: Input, retriesLeft: boolean): Promise<Output> {
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

      await this.eventBus.emit(
        new FileUpdatedEvent({
          before: FileMappers.toDTO(document),
          after: FileMappers.toDTO(processedDoc),
        })
      );

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
