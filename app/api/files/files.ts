import { deleteUploadedFiles } from 'api/files/filesystem';
import connections from 'api/relationships';

import model from './filesModel';
import { validateFile } from '../../shared/types/fileSchema';
import { FileType } from '../../shared/types/fileType';

export const files = {
  async save(file: FileType) {
    return model.save(await validateFile(file));
  },

  get: model.get.bind(model),

  async delete(query: any = {}) {
    const toDeleteFiles: FileType[] = (await model.get(query)) || { filename: '' };

    await model.delete(query);
    await connections.delete({ file: { $in: toDeleteFiles.map(f => f._id?.toString()) } });
    await deleteUploadedFiles(toDeleteFiles);

    return toDeleteFiles;
  },
};
