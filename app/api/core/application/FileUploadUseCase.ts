import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Document } from 'api/files.v2/model/Document';
import { File } from 'api/files.v2/model/File';
import date from 'api/utils/date';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { Thumbnail } from 'api/files.v2/model/Thumbnail';
import path from 'path';
import { AbstractUseCase } from '../libs/UseCase';
import { PDFService } from './contracts/PDFService';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';

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
    const tmpFile = new File({
      filename: input.file.filename,
      source: createReadStream(path.join(input.file.destination, input.file.filename)),
    });
    const pdfInfo = (await this.deps.pdfService.extractText(tmpFile)).getDataOrThrow();

    const document = new Document({
      id: this.idGenerator.generate(),
      entity: input.entityId,
      ...input.file,
      language: pdfInfo.language.key,
      totalPages: pdfInfo.totalPages,
      status: 'ready',
      creationDate: date.currentUTC(),
      uploaded: true,
      fullText: pdfInfo.pages,
    });

    // const entity = await (await this.deps.entitiesDS.getEntitiesBySharedIds([input.entityId])).first();
    //
    // if (!entity) {
    //   throw new Error('entity does not exists')
    // }

    const thumbnail = new Thumbnail({
      originalname: 'originalThumbnailName.jpg',
      filename: `${document.id}.jpg`,
      mimetype: 'image/jpeg',
      size: 1,
      id: this.idGenerator.generate(),
      entity: input.entityId,
      language: pdfInfo.language.key,
      creationDate: date.currentUTC(),
      uploaded: true,
    });

    const pdfFile = new File({
      filename: document.filename,
      source: createReadStream(path.join(input.file.destination, input.file.filename)),
    });

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.create(document);
      await this.deps.filesDS.create(thumbnail);
      await this.deps.fileStorage.storeFile({
        type: 'document',
        file: pdfFile,
      });
      await this.deps.fileStorage.storeFile({
        type: 'thumbnail',
        file: new File({
          filename: thumbnail.filename,
          source: (
            await this.deps.pdfService.createThumbnail(
              new File({
                filename: document.filename,
                source: createReadStream(path.join(input.file.destination, input.file.filename)),
              })
            )
          ).getDataOrThrow().source,
        }),
      });
    });

    return document;
  }
}

export { FileUploadUseCase };
export type { Input as CreateEntityUseCaseInput };
