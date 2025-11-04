import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Document } from 'api/files.v2/model/Document';
import date from 'api/utils/date';
// eslint-disable-next-line node/no-restricted-import
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { FileContents } from 'api/files.v2/model/FileContents';
import { Thumbnail } from 'api/files.v2/model/Thumbnail';
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
  fileStorage: FileStorage;
  entitiesDS: MultiLanguageEntityDataSource;
};

class FileUploadUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync(input: Input): Promise<Output> {
    const tmpFile = new FileContents(path.join(input.file.destination, input.file.filename));
    const pdfInfo = await this.deps.pdfService.extractText(tmpFile);

    const document = new Document({
      id: this.idGenerator.generate(),
      entity: input.entityId,
      ...input.file,
      language: pdfInfo.isOk() ? pdfInfo.getData().language.key : 'en',
      totalPages: pdfInfo.isOk() ? pdfInfo.getData().totalPages : 0,
      status: pdfInfo.isError() ? 'failed' : 'ready',
      creationDate: date.currentUTC(),
      uploaded: true,
      fullText: pdfInfo.isOk() ? pdfInfo.getData().pages : {},
    });

    // const entity = await (await this.deps.entitiesDS.getEntitiesBySharedIds([input.entityId])).first();
    //
    // if (!entity) {
    //   throw new Error('entity does not exists')
    // }

    let thumbnail: Thumbnail;
    let pdfFile: FileContents;
    let thumbnailFile: FileContents;
    if (pdfInfo.isOk()) {
      thumbnail = new Thumbnail({
        originalname: 'originalThumbnailName.jpg',
        filename: `${document.id}.jpg`,
        mimetype: 'image/jpeg',
        size: 1,
        id: this.idGenerator.generate(),
        entity: input.entityId,
        language: pdfInfo.getData().language.key,
        creationDate: date.currentUTC(),
        uploaded: true,
      });

      pdfFile = new FileContents(path.join(input.file.destination, document.filename));

      thumbnailFile = (await this.deps.pdfService.createThumbnail(pdfFile)).getDataOrThrow();
      thumbnailFile.filename = thumbnail.filename;
    }

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.create(document);
      if (pdfInfo.isOk()) {
        await this.deps.filesDS.create(thumbnail);
        await this.deps.fileStorage.storeFile({
          type: 'document',
          file: pdfFile,
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

    return document;
  }
}

export { FileUploadUseCase };
export type { Input as CreateEntityUseCaseInput };
