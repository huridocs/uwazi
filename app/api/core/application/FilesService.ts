import { ObjectId } from 'mongodb';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileAttachment } from '#api/core/domain/files/FileAttachment.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { FileCreatedEvent } from '#api/files/events/FileCreatedEvent.js';
import date from '#api/utils/date.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { FileUpdatedEvent } from '#api/files/events/FileUpdatedEvent.js';
import { BaseFile } from '../domain/files/BaseFile.js';
import { FileContentsIO } from '../infrastructure/files/FileContentIO.js';
import { FileMappers } from '../infrastructure/mongodb/files/FilesMappers.js';
import { MongoRelationshipsV1DataSource } from '../infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { PDFService } from '../infrastructure/services/PDFService.js';
import { EventsBus } from '../libs/eventsbus/index.js';
import { Dispatcher } from './contracts/Dispatcher.js';
import { Result } from '../libs/Result.js';
import { IdGenerator } from './contracts/IdGenerator.js';
import { TransactionManager } from './contracts/TransactionManager.js';
import { PathManager } from '../infrastructure/files/PathManager.js';
import { CannotTransformFileToAttachment } from '../domain/files/errors.js';

type Deps = {
  idGenerator: IdGenerator;
  fileStorage: FileStorage;
  filesDS: FilesDataSource;
  jobsDispatcher: Dispatcher;
  pdfService: PDFService;
  filesIO: FileContentsIO;
  relV1DS: MongoRelationshipsV1DataSource;
  transactionManager: TransactionManager;
  eventBus: EventsBus;
  pathManager: PathManager;
};

type FilesServiceContext = {
  userId?: string;
  tenantName?: string;
};

function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

class FilesService {
  constructor(
    protected deps: Deps,
    private context: FilesServiceContext = {}
  ) {}

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
   * Actor (userId) and tenant (tenantName) are injected at construction time via
   * FilesServiceFactory, which reads them from ExecutionContext. Do not pass them
   * as method arguments.
   *
   * @param files - Array of BaseFile domain objects to insert
   * @throws {Error} If PDFDocument files in processing status are inserted but no userId/tenantName in context
   */
  async insert(files: BaseFile[]) {
    if (isNonEmptyArray<BaseFile>(files)) {
      await this.deps.filesDS.bulkCreate(files);

      const processingPDFs = files
        .filter((f): f is PDFDocument => f instanceof PDFDocument && f.isProcessing())
        .map(f => {
          const { userId, tenantName } = this.context;
          if (!userId) {
            throw new Error('PDFPostProcess needs a user Id');
          }
          if (!tenantName) {
            throw new Error('PDFPostProcess needs a tenant name');
          }
          return {
            tenantName,
            documentId: f.id,
            userId,
          };
        });

      if (processingPDFs.length > 0) {
        await this.deps.jobsDispatcher.postProcessPDFs(processingPDFs);
      }

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

  async bulkUpsert(files: BaseFile[]) {
    const _files = files.filter(f => f.hasChanged);

    if (!_files.length) return;

    await this.deps.filesDS.bulkUpdate(_files);

    this.deps.transactionManager.onCommitted(async () => {
      await ArrayUtils.sequentialFor(_files, async file => {
        const after = file.toDTO();
        const before = file.previousVersion?.toDTO();
        if (!before) return;

        await this.deps.eventBus.emit(
          new FileUpdatedEvent({
            after,
            before,
          })
        );
      });
    });
  }

  async deleteEntityFiles(entitySharedIds: string[]) {
    const files = await this.deps.filesDS.getByEntitiesIds(entitySharedIds).all();
    if (isNonEmptyArray(files)) {
      await this.delete(files);
    }
  }

  async delete(files: BaseFile[]) {
    if (!files.length) return;
    const pdfDocuments = files.filter(
      (f): f is PDFDocument => f instanceof PDFDocument && f.isReady()
    );
    const thumbnails = await this.deps.filesDS
      .getThumbnailsForProcessedPDFs(pdfDocuments.map(f => f.id))
      .all();

    const allFilesToDelete = [...files, ...thumbnails];

    const contentFiles = allFilesToDelete.filter(f => f.hasContent());

    await this.deps.filesDS.delete(allFilesToDelete);
    await this.deps.relV1DS.deleteByFiles(contentFiles);

    this.deps.transactionManager.onCommitted(async () => {
      await this.deps.eventBus.emit(
        new FilesDeletedEvent({ files: allFilesToDelete.map(f => FileMappers.toDBO(f)) })
      );
      await this.deps.jobsDispatcher.deleteFilesFromStorage(
        contentFiles.map(file => this.deps.pathManager.createPath(file))
      );
    });
  }

  async demoteToAttachment(fileId: string): Promise<void> {
    const file = (await this.deps.filesDS.getById(fileId)).getDataOrThrow();

    if (file.type !== 'document') {
      throw new CannotTransformFileToAttachment(fileId, file.type);
    }

    const pdfDoc = file as PDFDocument;

    const attachment = new FileAttachment({
      id: pdfDoc.id,
      originalname: pdfDoc.originalname,
      filename: pdfDoc.filename,
      mimetype: pdfDoc.mimetype,
      size: pdfDoc.size,
      creationDate: pdfDoc.creationDate,
      uploaded: pdfDoc.uploaded,
      entity: pdfDoc.entity,
      content: pdfDoc.content,
    });

    await this.deps.transactionManager.run(async () => {
      await this.deps.filesDS.replaceFile(attachment);

      this.deps.transactionManager.onCommitted(async () => {
        await this.deps.eventBus.emit(
          new FileUpdatedEvent({
            after: attachment.toDTO(),
            before: pdfDoc.toDTO(),
          })
        );
      });
    });
  }

  async createThumbnail(doc: PDFDocument, language: LanguageISO6391) {
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
export type { Deps as FilesServiceDeps, FilesServiceContext };
