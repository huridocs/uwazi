import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Document } from 'api/files.v2/model/Document';
import date from 'api/utils/date';
// eslint-disable-next-line node/no-restricted-import
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { FileMappers } from 'api/files.v2/database/FilesMappers';
import { fileDBO } from 'api/files.v2/database/schemas/filesTypes';
import { FileContents } from 'api/files.v2/model/FileContents';
import { InputFile } from 'api/files.v2/model/InputFile';
import { Thumbnail } from 'api/files.v2/model/Thumbnail';
import { AbstractUseCase } from '../libs/UseCase';
import { PDFService } from './contracts/PDFService';

type Input = {
  uploadedFile: InputFile;
  entityId: string;
};

type Output = Omit<fileDBO, '_id'> & { _id: string };

type Deps = {
  filesDS: FilesDataSource;
  pdfService: PDFService;
  fileStorage: FileStorage;
  entitiesDS: MultiLanguageEntityDataSource;
};

class FileUploadUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync({ entityId, uploadedFile }: Input): Promise<Output> {
    const pdfInfo = await this.deps.pdfService.extractText(uploadedFile.contents);

    const document = new Document({
      id: this.idGenerator.generate(),
      entity: entityId,
      ...uploadedFile.metadata,
      filename: uploadedFile.contents.filename,
      language: pdfInfo.isOk() ? pdfInfo.getData().language.key : 'en',
      totalPages: pdfInfo.isOk() ? pdfInfo.getData().totalPages : 0,
      status: pdfInfo.isError() ? 'failed' : 'ready',
      creationDate: date.currentUTC(),
      uploaded: true,
      fullText: pdfInfo.isOk() ? pdfInfo.getData().pages : {},
    });

    let thumbnail: Thumbnail;
    let thumbnailFile: FileContents;
    if (pdfInfo.isOk()) {
      thumbnail = new Thumbnail({
        originalname: 'originalThumbnailName.jpg',
        filename: `${document.id}.jpg`,
        mimetype: 'image/jpeg',
        size: 1,
        id: this.idGenerator.generate(),
        entity: entityId,
        language: pdfInfo.getData().language.key,
        creationDate: date.currentUTC(),
        uploaded: true,
      });

      thumbnailFile = (
        await this.deps.pdfService.createThumbnail(uploadedFile.contents)
      ).getDataOrThrow();
      thumbnailFile.filename = thumbnail.filename;
    }

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.create(document);
      if (pdfInfo.isOk()) {
        await this.deps.filesDS.create(thumbnail);
        await this.deps.fileStorage.storeFile({
          type: 'document',
          file: uploadedFile.contents,
        });
        await this.deps.fileStorage.storeFile({
          type: 'thumbnail',
          file: thumbnailFile,
        });
      }
    });

    if (pdfInfo.isError()) {
      throw pdfInfo.getError();
    }

    return FileMappers.toDTO(document);
  }
}

export { FileUploadUseCase };
