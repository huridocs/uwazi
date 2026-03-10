/* eslint-disable max-statements */
import { FilesDataSource } from 'api/core/application/contracts/FilesDataSource';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { ProcessingFileFailed } from 'api/core/domain/files/errors';
import { ProcessedPDF } from 'api/core/domain/files/ProcessedPDF';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { FileIsNotAPDF } from '../infrastructure/services/PDFService';
import { EventsBus } from '../libs/eventsbus';
import { AbstractUseCase } from '../libs/UseCase';
import { PDFService } from './contracts/PDFService';
import { FilesService } from './FilesService';

type Input = {
  documentId: string;
};

type Output = ProcessedPDF;

type Deps = {
  eventBus: EventsBus;
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  pdfService: PDFService;
  filesService: FilesService;
};

export class PDFPostProcessJob extends AbstractUseCase<Input, Output, Deps, [boolean]> {
  async execute({ documentId }: Input, retriesLeft: boolean): Promise<Output> {
    const processingPDF = (await this.deps.filesDS.getProcessingById(documentId)).getDataOrThrow();
    try {
      const pdfInfo = (
        await this.deps.pdfService.extractText(processingPDF.content)
      ).getDataOrThrow();

      const processedPDF = processingPDF.asProcessed({
        language: pdfInfo.language.key,
        totalPages: pdfInfo.totalPages,
        fullText: pdfInfo.pages,
      });

      const thumbnail = (
        await this.deps.filesService.createThumbnail(processedPDF, pdfInfo.language.key)
      ).getDataOrThrow();

      await this.transactionManager.run(async () => {
        await this.deps.filesDS.update(processedPDF);

        await this.deps.filesDS.create(thumbnail);
        await this.deps.fileStorage.storeFile(thumbnail);
      });

      await this.eventBus.emit(
        new FileUpdatedEvent({
          before: processingPDF.toDTO(),
          after: processedPDF.toDTO(),
        })
      );

      return processedPDF;
    } catch (e) {
      if (!retriesLeft || e instanceof FileIsNotAPDF) {
        await this.transactionManager.run(async () => {
          processingPDF.failed();
          await this.deps.filesDS.update(processingPDF);
        });
      }
      throw new ProcessingFileFailed(processingPDF, e);
    }
  }
}
