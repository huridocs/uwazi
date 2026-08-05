/* eslint-disable max-statements */
import { inspect } from 'util';
import entities from '#api/entities/index.js';
import users from '#api/users/users.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import connections from '#api/relationships/relationships.js';
import { search } from '#api/search/index.js';
import { cleanupRecordsOfFiles } from '#api/services/ocr/ocrRecords.js';
import { EntityWithFilesSchema } from '#shared/types/entityType.js';
import { validateFile } from '#shared/types/fileSchema.js';
import { FileType } from '#shared/types/fileType.js';
import { FileCreatedEvent } from './events/FileCreatedEvent.js';
import { FilesDeletedEvent } from './events/FilesDeletedEvent.js';
import { FileUpdatedEvent } from './events/FileUpdatedEvent.js';
import { mimeTypeFromUrl } from './extensionHelper.js';
import { filesModel } from './filesModel.js';
import { storage } from './storage.js';
import { V2 } from './v2_support.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { FileMappers } from '#api/core/infrastructure/mongodb/files/FilesMappers.js';
import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import { User } from '#api/users.v2/model/User.js';

const deduceMimeType = (_file: FileType) => {
  const file = { ..._file };
  if (file.url && !file._id) {
    const mimetype = mimeTypeFromUrl(file.url);
    file.mimetype = mimetype;
  }

  return file;
};

const ensureEntityActor = async (entity: EntityWithFilesSchema) => {
  if (ExecutionContext.actor) {
    return;
  }

  const actorId = entity.user?.toString?.();
  if (!actorId) {
    throw new Error(`Entity actor is missing for sharedId ${entity.sharedId}`);
  }

  const actorInDb = await users.getById(actorId, '-password', false, true);
  if (!actorInDb) {
    throw new Error(`Entity actor not found for user ${actorId}`);
  }

  ExecutionContext.actor = User.createFrom(actorInDb);
};

export class UpdateFileError extends Error {
  constructor() {
    super('Can not update a File that does not exist');
  }
}

export const files = {
  /**
   * @deprecated
   * This method is deprecated and should not be used anymore.
   */
  async save(_file: FileType, index = true) {
    const file = deduceMimeType(_file);

    const existingFile = file._id ? await filesModel.getById(file._id) : undefined;
    if (file._id && !existingFile) throw new UpdateFileError();

    const savedFile = await filesModel.save(await validateFile(file));
    if (index) {
      await search.indexEntities({ sharedId: savedFile.entity }, '+fullText');
    }

    if (existingFile) {
      await applicationEventsBus.emit(
        new FileUpdatedEvent({ before: existingFile, after: savedFile })
      );
    } else {
      if (!savedFile.url && !savedFile.filename) {
        LoggerFactory.default().error([
          inspect(new Error('[Files] a file was created without url or filename')),
          inspect(savedFile),
        ]);
      }
      await applicationEventsBus.emit(new FileCreatedEvent({ newFile: savedFile }));
    }

    return savedFile;
  },
  /**
   * @deprecated
   * This method is deprecated and should not be used anymore.
   */
  get: filesModel.get.bind(filesModel),
  /**
   * @deprecated
   * This method is deprecated and should not be used anymore.
   */
  async delete(query: any = {}) {
    const hasFileName = (file: FileType): file is FileType & { filename: string } =>
      !!file.filename;

    const toDeleteFiles: FileType[] = await filesModel.get(query);
    await filesModel.delete(query);
    if (toDeleteFiles.length > 0) {
      const idsToDelete = toDeleteFiles.map(f => f._id!.toString());
      await connections.delete({ file: { $in: idsToDelete } });
      await V2.deleteTextReferencesToFiles(idsToDelete);

      await Promise.all(
        toDeleteFiles
          .filter(hasFileName)
          .map(async ({ filename, type }) => storage.removeFile(filename, type || 'document'))
      );
      await search.indexEntities(
        { sharedId: { $in: toDeleteFiles.map(f => f.entity?.toString()) } },
        '+fullText'
      );

      await applicationEventsBus.emit(new FilesDeletedEvent({ files: toDeleteFiles }));
    }

    await cleanupRecordsOfFiles(toDeleteFiles.map(f => f._id));

    return toDeleteFiles;
  },

  async tocReviewed(_id: string) {
    const existingFile = (
      await FilesDataSourceFactory.default().getById<PDFDocument>(_id)
    ).getDataOrThrow();

    const updatedFile = existingFile.update({ generatedToc: false });

    await ExecutionContext.transactionManager.run(async () =>
      FilesServiceFactory.default().bulkUpsert([updatedFile])
    );

    const entityFiles = await FilesDataSourceFactory.default().getByEntitiesIds([
      updatedFile.entity,
    ]);
    const generatedToc = entityFiles
      .filter((f): f is PDFDocument => f instanceof PDFDocument)
      .some(f => f.generatedToc);

    const [entity] = await entities.get({ sharedId: updatedFile.entity }, '+permissions');
    await ensureEntityActor(entity);
    const template = entity.template?.toString?.();
    if (!template) {
      LoggerFactory.default().info(
        `Skipping generatedToc entity update for sharedId ${entity.sharedId}: entity is missing template`
      );
      return FileMappers.toDBO(updatedFile);
    }

    const documents = (entity.documents || [])
      .filter(
        (
          doc: FileType
        ): doc is FileType & { _id: NonNullable<FileType['_id']>; originalname: string } =>
          Boolean(doc._id && doc.originalname)
      )
      .map((doc: FileType & { _id: NonNullable<FileType['_id']>; originalname: string }) => ({
        _id: doc._id.toString(),
        originalname: doc.originalname,
      }));
    const attachments = (entity.attachments || [])
      .filter((attachment: FileType): attachment is FileType & { originalname: string } =>
        Boolean(attachment.originalname)
      )
      .map((attachment: FileType & { originalname: string }) => ({
        _id: attachment._id?.toString(),
        originalname: attachment.originalname,
        ...(attachment.url ? { url: attachment.url } : {}),
      }));

    await EntityFacade.update(
      {
        _id: entity._id.toString(),
        sharedId: entity.sharedId,
        language: entity.language,
        title: entity.title,
        template,
        generatedToc,
        documents,
        attachments,
      },
      entity.language
    );

    return FileMappers.toDBO(updatedFile);
  },
};
