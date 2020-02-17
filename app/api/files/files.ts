import { deleteUploadedFiles } from 'api/files/filesystem';

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

    await deleteUploadedFiles(toDeleteFiles);

    return toDeleteFiles;
  },
};
