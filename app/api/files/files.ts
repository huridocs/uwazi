import { deleteUploadedFiles } from 'api/files/filesystem';

import model from './filesModel';
import { validateFile } from '../../shared/types/fileSchema';
import { FileSchema } from '../../shared/types/fileType';

export const files = {
  async save(file: FileSchema) {
    return model.save(await validateFile(file));
  },

  get: model.get.bind(model),

  async delete(query: any = {}) {
    const toDeleteFiles: FileSchema[] = (await model.get(query)) || { filename: '' };

    await model.delete(query);

    await deleteUploadedFiles(toDeleteFiles);

    return toDeleteFiles;
  },
};
