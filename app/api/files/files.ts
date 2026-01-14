/* eslint-disable max-statements */
import entities from '../entities/index.js';
import { applicationEventsBus } from '../eventsbus/index.js';
import { mimeTypeFromUrl } from './extensionHelper.js';
import { DefaultLogger } from '#api/log.v2/infrastructure/StandardLogger.js';
import connections from '../relationships/index.js';
import { search } from '../search/index.js';
import { cleanupRecordsOfFiles } from '../services/ocr/ocrRecords.js';
import { validateFile } from '#shared/types/fileSchema.js';
import { FileType } from '#shared/types/fileType.js';
import { inspect } from 'util';
import { FileCreatedEvent } from './events/FileCreatedEvent.js';
import { FilesDeletedEvent } from './events/FilesDeletedEvent.js';
import { FileUpdatedEvent } from './events/FileUpdatedEvent.js';
import { filesModel } from './filesModel.js';
import { storage } from './storage.js';
import { V2 } from './v2_support.js';

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
    const savedFile = await files.save({ _id, generatedToc: false });
    const sameEntityFiles = await files.get({ entity: savedFile.entity }, { generatedToc: 1 });
    const [entity] = await entities.get({
      sharedId: savedFile.entity,
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

    return savedFile;
  },
};
