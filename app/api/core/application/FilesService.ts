import { ArrayUtils } from 'api/common.v2/utils/Array';
import { FilesDataSource } from 'api/core/application/contracts/FilesDataSource';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { Document } from 'api/core/domain/files/Document';
import { ProcessedDocument } from 'api/core/domain/files/ProcessedDocument';
import { Thumbnail } from 'api/core/domain/files/Thumbnail';
import { UwaziFile, UwaziFileWithContents } from 'api/core/domain/files/UwaziFile';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import date from 'api/utils/date';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { URLAttachment } from '../domain/files/URLAttachment';
import { FileContentsIO } from '../infrastructure/files/FileContentIO';
import { PDFPostProcessJob } from '../infrastructure/jobs/PDFPostProcessJob';
import { FileMappers } from '../infrastructure/mongodb/files/FilesMappers';
import { MongoRelationshipsV1DataSource } from '../infrastructure/mongodb/MongoRelationshipsV1DataSource';
import { PDFService } from '../infrastructure/services/PDFService';
import { EventsBus } from '../libs/eventsbus';
import { JobsDispatcher } from '../libs/queue/application/contracts/JobsDispatcher';
import { Result } from '../libs/Result';
import { IdGenerator } from './contracts/IdGenerator';
import { TransactionManager } from './contracts/TransactionManager';

type FileServiceDependencies = {
  idGenerator: IdGenerator;
  fileStorage: FileStorage;
  filesDS: FilesDataSource;
  jobsDispatcher: JobsDispatcher;
  pdfService: PDFService;
  filesIO: FileContentsIO;
  relV1DS: MongoRelationshipsV1DataSource;
  transactionManager: TransactionManager;
  eventBus: EventsBus;
};

function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

class FilesService {
  constructor(protected deps: FileServiceDependencies) {}

  async storeFiles(files: UwaziFile[]) {
    await ArrayUtils.sequentialFor(
      files.filter((f): f is UwaziFileWithContents => !(f instanceof URLAttachment)),
      async file => {
        await this.deps.fileStorage.storeFile(file);
      }
    );
  }

  async insert(files: UwaziFile[]) {
    if (isNonEmptyArray<UwaziFile>(files)) {
      await this.deps.filesDS.bulkCreate(files);

      await this.deps.jobsDispatcher.dispatchMany(async dispatch => {
        files.forEach(file => {
          if (file instanceof Document) {
            const userId = permissionsContext.getUserInContext()?._id?.toString();
            if (!userId) {
              throw new Error('PDFPostProcess needs a user Id');
            }
            dispatch(PDFPostProcessJob, {
              tenantName: tenants.current().name,
              documentId: file.id,
              userId,
            });
          }
        });
      });
    }
  }

  async deleteEntityFiles(entitySharedIds: string[]) {
    const files = await this.deps.filesDS.getByEntitiesIds(entitySharedIds).all();
    if (isNonEmptyArray(files)) {
      await this.delete(files);
    }
  }

  async delete(files: [UwaziFile, ...UwaziFile[]]) {
    const contentFiles = files.filter(
      (f): f is UwaziFileWithContents => !(f instanceof URLAttachment)
    );

    await this.deps.filesDS.delete(files);
    await this.deps.relV1DS.deleteByFiles(contentFiles);

    this.deps.transactionManager.onCommitted(async () => {
      await this.deps.eventBus.emit(
        new FilesDeletedEvent({ files: files.map(f => FileMappers.toDBO(f)) })
      );
    });

    //this to be jobified
    await ArrayUtils.sequentialFor(contentFiles, async f => this.deps.fileStorage.removeFile(f));
    //
  }

  async createThumbnail(doc: ProcessedDocument, language: LanguageISO6391) {
    const thumbnailResult = await this.deps.pdfService.createThumbnail(doc.content);
    if (thumbnailResult.isError()) {
      return thumbnailResult;
    }
    const diskThumbnail = thumbnailResult.getData();
    return Result.ok(
      new Thumbnail({
        originalname: `${doc.id}.jpg`,
        filename: `${doc.id}.jpg`,
        mimetype: 'image/jpeg',
        size: (await this.deps.filesIO.size(diskThumbnail)).getDataOrThrow(),
        id: this.deps.idGenerator.generate(),
        entity: doc.entity,
        language,
        creationDate: date.currentUTC(),
        uploaded: true,
        content: diskThumbnail.toContent(),
      })
    );
  }
}

export { FilesService };
