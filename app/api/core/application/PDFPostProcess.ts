/* eslint-disable max-statements */
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { Thumbnail } from 'api/files.v2/model/Thumbnail';
import date from 'api/utils/date';
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
    const document = (await this.deps.filesDS.getProcessingById(documentId)).getDataOrThrow();
    const fileContents = await this.deps.fileStorage.getFile({
      type: 'document',
      filename: document.filename,
    });

    const conversionResult = await this.deps.pdfService.extractText(fileContents);
    if (conversionResult.isError()) {
      document.failed();
      await this.deps.filesDS.update(document);
      throw new Error();
    }

    const pdfInfo = conversionResult.getData();

    const thumbnailFile = (
      await this.deps.pdfService.createThumbnail(fileContents)
    ).getDataOrThrow();

    const thumbnail = new Thumbnail({
      originalname: 'originalThumbnailName.jpg',
      filename: `${document.id}.jpg`,
      mimetype: 'image/jpeg',
      size: (await thumbnailFile.size()).getDataOrThrow(),
      id: this.idGenerator.generate(),
      entity: document.entity,
      language: pdfInfo.language.key,
      creationDate: date.currentUTC(),
      uploaded: true,
    });
    thumbnailFile.filename = thumbnail.filename;

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.update(
        ProcessedDocument.fromDocument(document, {
          language: pdfInfo.language.key,
          totalPages: pdfInfo.totalPages,
          fullText: pdfInfo.pages,
        })
      );

      await this.deps.filesDS.create(thumbnail);
      await this.deps.fileStorage.storeFile({
        type: 'thumbnail',
        file: thumbnailFile,
      });
    });
  }
}
