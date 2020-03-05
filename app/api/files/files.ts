import { deleteUploadedFiles } from 'api/files/filesystem';
import connections from 'api/relationships';
import { search } from 'api/search';

import model from './filesModel';
import { validateFile } from '../../shared/types/fileSchema';
import { FileType } from '../../shared/types/fileType';

export const files = {
  async save(file: FileType) {
    const savedFile = await model.save(await validateFile(file));
    await search.indexEntities({ sharedId: file.entity }, '+fullText');
    return savedFile;
  },

  get: model.get.bind(model),

  async delete(query: any = {}) {
    const toDeleteFiles: FileType[] = await model.get(query);

    await model.delete(query);
    await connections.delete({ file: { $in: toDeleteFiles.map(f => f._id?.toString()) } });
    await deleteUploadedFiles(toDeleteFiles);
    await search.indexEntities(
      { sharedId: { $in: toDeleteFiles.map(f => f.entity?.toString()) } },
      '+fullText'
    );

    return toDeleteFiles;
  },
};
