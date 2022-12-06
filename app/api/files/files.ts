import entities from 'api/entities';
import { applicationEventsBus } from 'api/eventsbus';
import { mimeTypeFromUrl } from 'api/files/extensionHelper';
import { cleanupRecordsOfFiles } from 'api/services/ocr/ocrRecords';
import connections from 'api/relationships';
import { search } from 'api/search';
import { validateFile } from 'shared/types/fileSchema';
import { FileType } from 'shared/types/fileType';
import { FileCreatedEvent } from './events/FileCreatedEvent';
import { FilesDeletedEvent } from './events/FilesDeletedEvent';
import { FileUpdatedEvent } from './events/FileUpdatedEvent';
import { filesModel } from './filesModel';
import { storage } from './storage';
import { V2 } from './v2_support';

const deduceMimeType = (_file: FileType) => {
  const file = { ..._file };
  if (file.url && !file._id) {
    const mimetype = mimeTypeFromUrl(file.url);
    file.mimetype = mimetype;
  }

  return file;
};

export const files = {
  async save(_file: FileType, index = true) {
    const file = deduceMimeType(_file);

    const existingFile = file._id ? await filesModel.getById(file._id) : undefined;
    const savedFile = await filesModel.save(await validateFile(file));
    if (index) {
      await search.indexEntities({ sharedId: savedFile.entity }, '+fullText');
    }

    if (existingFile) {
      await applicationEventsBus.emit(
        new FileUpdatedEvent({ before: existingFile, after: savedFile })
      );
    } else {
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
