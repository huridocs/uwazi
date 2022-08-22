import connections from 'api/relationships';
import { search } from 'api/search';
import entities from 'api/entities';
import { mimeTypeFromUrl } from 'api/files/extensionHelper';
import { cleanupRecordsOfFiles } from 'api/services/ocr/ocrRecords';
import { filesModel } from './filesModel';
import { validateFile } from '../../shared/types/fileSchema';
import { FileType } from '../../shared/types/fileType';
import { storage } from './storage';

export const files = {
  async save(_file: FileType, index = true) {
    const file = { ..._file };
    if (file.url && !file._id) {
      const mimetype = mimeTypeFromUrl(file.url);
      file.mimetype = mimetype;
    }

    const savedFile = await filesModel.save(await validateFile(file));
    if (index) {
      await search.indexEntities({ sharedId: savedFile.entity }, '+fullText');
    }
    return savedFile;
  },

  get: filesModel.get.bind(filesModel),

  async delete(query: any = {}) {
    const toDeleteFiles: FileType[] = await filesModel.get(query);
    await filesModel.delete(query);
    if (toDeleteFiles.length > 0) {
      await connections.delete({ file: { $in: toDeleteFiles.map(f => f._id?.toString()) } });

      await Promise.all(
        toDeleteFiles.map(async ({ filename, type }) =>
          storage.removeFile(filename || '', type || 'document')
        )
      );
      await search.indexEntities(
        { sharedId: { $in: toDeleteFiles.map(f => f.entity?.toString()) } },
        '+fullText'
      );
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
