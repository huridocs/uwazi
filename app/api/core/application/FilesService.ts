import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { FilesDataSource } from './contracts/FilesDataSource.js';
import { FileStorage } from './contracts/FileStorage.js';
import { ProcessingPDF } from '../domain/files/ProcessingPDF.js';
import { ProcessedPDF } from '../domain/files/ProcessedPDF.js';
import { Thumbnail } from '../domain/files/Thumbnail.js';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { FileCreatedEvent } from '#api/files/events/FileCreatedEvent.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import date from '#api/utils/date.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { ObjectId } from 'mongodb';
import { BaseFile } from '../domain/files/BaseFile.js';
import { FileContentsIO } from '../infrastructure/files/FileContentIO.js';
import { PDFPostProcessJobHandler } from '../infrastructure/jobs/PDFPostProcessJobHandler.js';
import { FileMappers } from '../infrastructure/mongodb/files/FilesMappers.js';
import { MongoRelationshipsV1DataSource } from '../infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { PDFService } from '../infrastructure/services/PDFService.js';
import { EventsBus } from '../libs/eventsbus/index.js';
import { JobsDispatcher } from '../libs/queue/application/contracts/JobsDispatcher.js';
import { Result } from '../libs/Result.js';
import { IdGenerator } from './contracts/IdGenerator.js';
import { TransactionManager } from './contracts/TransactionManager.js';
import { DeleteFileFromStorageJobHandler } from '../infrastructure/jobs/DeleteFileFromStorageJobHandler.js';
import { PathManager } from '../infrastructure/files/PathManager.js';

type Deps = {
  idGenerator: IdGenerator;
  fileStorage: FileStorage;
  filesDS: FilesDataSource;
  jobsDispatcher: JobsDispatcher;
  pdfService: PDFService;
  filesIO: FileContentsIO;
  relV1DS: MongoRelationshipsV1DataSource;
  transactionManager: TransactionManager;
  eventBus: EventsBus;
  pathManager: PathManager;
};

function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

class FilesService {
  constructor(protected deps: Deps) {}

  async storeFiles(files: BaseFile[]) {
    await ArrayUtils.sequentialFor(
      files.filter(f => f.hasContent()),
      async file => {
        await this.deps.fileStorage.storeFile(file);
      }
    );
  }

  /**
   * Inserts files into the database and dispatches processing jobs.
   *
   * IMPORTANT: This method automatically emits FileCreatedEvent for each file
   * after the transaction commits. Callers do NOT need to emit events manually.
   *
   * This method should be called within a transaction context using
   * transactionManager.run(). Events are emitted only after the transaction
   * successfully commits to ensure data consistency.
   *
   * @param files - Array of BaseFile domain objects to insert
   * @throws {Error} If PDFPostProcess is dispatched but no user context exists
   *
   * @example
   * // For use cases (typical pattern):
   * await this.transactionManager.run(async () => {
   *   await this.deps.filesService.insert([file]);
   * });
   * // FileCreatedEvent is emitted automatically after commit
   *
   * @example
   * // For external integrations (PreserveSync, etc.):
   * const transactionManager = TransactionManagerFactory.default();
   * const filesService = FilesServiceFactory.default(transactionManager);
   *
   * // 1. Store files to disk first
   * await filesService.storeFiles([attachment]);
   *
   * // 2. Insert within transaction
   * await transactionManager.run(async () => {
   *   await filesService.insert([attachment]);
   * });
   * // FileCreatedEvent is emitted automatically after commit
   */
  async insert(files: BaseFile[]) {
    if (isNonEmptyArray<BaseFile>(files)) {
      await this.deps.filesDS.bulkCreate(files);

      await this.deps.jobsDispatcher.dispatchMany(async dispatch => {
        files.forEach(file => {
          if (file instanceof ProcessingPDF) {
            const userId = permissionsContext.getUserInContext()?._id?.toString();
            if (!userId) {
              throw new Error('PDFPostProcess needs a user Id');
            }
            dispatch(PDFPostProcessJobHandler, {
              tenantName: tenants.current().name,
              documentId: file.id,
              userId,
            });
          }
        });
      });

      this.deps.transactionManager.onCommitted(async () => {
        await ArrayUtils.sequentialFor(files, async file => {
          const dto = file.toDTO();
          await this.deps.eventBus.emit(
            new FileCreatedEvent({
              newFile: { ...dto, _id: new ObjectId(dto._id) },
            })
          );
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

  async delete(files: [BaseFile, ...BaseFile[]]) {
    const contentFiles = files.filter(f => f.hasContent());

    await this.deps.filesDS.delete(files);
    await this.deps.relV1DS.deleteByFiles(contentFiles);

    this.deps.transactionManager.onCommitted(async () => {
      await this.deps.eventBus.emit(
        new FilesDeletedEvent({ files: files.map(f => FileMappers.toDBO(f)) })
      );
      await this.deps.jobsDispatcher.dispatchMany(async dispatch => {
        await ArrayUtils.sequentialFor(contentFiles, async file => {
          dispatch(DeleteFileFromStorageJobHandler, {
            filePath: this.deps.pathManager.createPath(file),
          });
        });
      });
    });
  }

  async createThumbnail(doc: ProcessedPDF, language: LanguageISO6391) {
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
