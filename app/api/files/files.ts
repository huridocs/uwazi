import entities from 'api/entities';
import { mimeTypeFromUrl } from 'api/files/extensionHelper';
import { deleteUploadedFiles } from 'api/files/filesystem';
import { cleanupRecordsOfFiles } from 'api/services/ocr/ocrRecords';
import connections from 'api/relationships';
import { search } from 'api/search';
import { Suggestions } from 'api/suggestions/suggestions';
import { deepEquals } from 'shared/data_utils/deepEquals';
import { validateFile } from 'shared/types/fileSchema';
import { FileType } from 'shared/types/fileType';
import { filesModel } from './filesModel';

const suggestionUpdateTrigger = (
  existingFile: FileType | null | undefined,
  savedFile: FileType
): boolean =>
  !!existingFile && !deepEquals(existingFile.extractedMetadata, savedFile.extractedMetadata);

export const files = {
  async save(_file: FileType, index = true) {
    const file = { ..._file };
    if (file.url && !file._id) {
      const mimetype = mimeTypeFromUrl(file.url);
      file.mimetype = mimetype;
    }

    const existingFile = file._id ? await filesModel.getById(file._id) : undefined;
    const savedFile = await filesModel.save(await validateFile(file));
    if (index) {
      await search.indexEntities({ sharedId: savedFile.entity }, '+fullText');
    }
    if (suggestionUpdateTrigger(existingFile, savedFile)) {
      await Suggestions.updateStates({ fileId: savedFile._id });
    }
    return savedFile;
  },

  get: filesModel.get.bind(filesModel),

  async delete(query: any = {}) {
    const toDeleteFiles: FileType[] = await filesModel.get(query);
    await filesModel.delete(query);
    if (toDeleteFiles.length > 0) {
      await connections.delete({ file: { $in: toDeleteFiles.map(f => f._id?.toString()) } });
      await deleteUploadedFiles(toDeleteFiles);
      await search.indexEntities(
        { sharedId: { $in: toDeleteFiles.map(f => f.entity?.toString()) } },
        '+fullText'
      );
      await Suggestions.delete({ fileId: { $in: toDeleteFiles.map(f => f._id) } });
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
