import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Document } from 'api/files.v2/model/Document';
import date from 'api/utils/date';
// eslint-disable-next-line node/no-restricted-import
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { FileMappers } from 'api/files.v2/database/FilesMappers';
import { fileDBO } from 'api/files.v2/database/schemas/filesTypes';
import { InputFile } from 'api/files.v2/model/InputFile';
import { JobsDispatcher } from '../libs/queue/application/contracts/JobsDispatcher';
import { AbstractUseCase } from '../libs/UseCase';
import { PDFService } from './contracts/PDFService';
import { PDFPostProcessJob } from '../infrastructure/jobs/PDFPostProcessJob';

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
  dispatcher: JobsDispatcher;
};

class FileUploadUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync({ entityId, uploadedFile }: Input): Promise<Output> {
    // const pdfInfo = await this.deps.pdfService.extractText(uploadedFile.contents);

    const document = new Document({
      id: this.idGenerator.generate(),
      entity: entityId,
      ...uploadedFile.metadata,
      filename: uploadedFile.filename,
      uploaded: true,
      status: 'processing',
      creationDate: date.currentUTC(),
      // language: pdfInfo.isOk() ? pdfInfo.getData().language.key : 'en',
      // totalPages: pdfInfo.isOk() ? pdfInfo.getData().totalPages : 0,
      // fullText: pdfInfo.isOk() ? pdfInfo.getData().pages : {},
    });

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.create(document);
      await this.deps.fileStorage.storeFile({
        type: 'document',
        file: uploadedFile.contents,
      });
      await this.jobsDispatcher.dispatch(PDFPostProcessJob, {
        documentId: document.id,
        userId: this.actor.id,
        tenantName: this.tenant.name,
      });
    });

    // let thumbnailFile: FileContents;
    // let thumbnail: Thumbnail;
    // if (pdfInfo.isOk()) {
    //   thumbnailFile = (
    //     await this.deps.pdfService.createThumbnail(uploadedFile.contents)
    //   ).getDataOrThrow();
    //   thumbnail = new Thumbnail({
    //     originalname: 'originalThumbnailName.jpg',
    //     filename: `${document.id}.jpg`,
    //     mimetype: 'image/jpeg',
    //     size: (await thumbnailFile.size()).getDataOrThrow(),
    //     id: this.idGenerator.generate(),
    //     entity: entityId,
    //     language: pdfInfo.getData().language.key,
    //     creationDate: date.currentUTC(),
    //     uploaded: true,
    //   });
    //   thumbnailFile.filename = thumbnail.filename;
    // }
    //
    // await this.transactionManager.run(async () => {
    //   await this.deps.filesDS.create(document);
    //   if (pdfInfo.isOk()) {
    //     await this.deps.filesDS.create(thumbnail);
    //     await this.deps.fileStorage.storeFile({
    //       type: 'document',
    //       file: uploadedFile.contents,
    //     });
    //     await this.deps.fileStorage.storeFile({
    //       type: 'thumbnail',
    //       file: thumbnailFile,
    //     });
    //   }
    // });
    //
    // if (pdfInfo.isError()) {
    //   throw pdfInfo.getError();
    // }

    return FileMappers.toDTO(document);
  }
}

export { FileUploadUseCase };
