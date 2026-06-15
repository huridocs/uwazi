/* eslint-disable max-statements */
import { inspect } from 'util';
import entities from '#api/entities/index.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import connections from '#api/relationships/index.js';
import { search } from '#api/search/index.js';
import { cleanupRecordsOfFiles } from '#api/services/ocr/ocrRecords.js';
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

const deduceMimeType = (_file: FileType) => {
  const file = { ..._file };
  if (file.url && !file._id) {
    const mimetype = mimeTypeFromUrl(file.url);
    file.mimetype = mimetype;
  }

  return file;
};

export class UpdateFileError extends Error {
  constructor() {
    super('Can not update a File that does not exist');
  }
}

export const files = {
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

  get: filesModel.get.bind(filesModel),

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

  async tocReviewed(_id: string, language: string) {
    const existingFile = (
      await FilesDataSourceFactory.default().getById<PDFDocument>(_id)
    ).getDataOrThrow();

    const updatedFile = existingFile.update({ generatedToc: false });

    await ExecutionContext.transactionManager.run(async () =>
      FilesServiceFactory.default().bulkUpsert([updatedFile])
    );

    const sameEntityFiles = await files.get({ entity: updatedFile.entity }, { generatedToc: 1 });
    const [entity] = await entities.get({
      sharedId: updatedFile.entity,
    });

    await entities.save(
      {
        _id: entity._id,
        sharedId: entity.sharedId,
        template: entity.template,
        generatedToc: sameEntityFiles.reduce<boolean>(
          (generated, file) => generated || Boolean(file.generatedToc),
          false
        ),
      },
      { user: {}, language }
    );

    return FileMappers.toDBO(updatedFile);
  },
};
