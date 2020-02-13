import { deleteFiles, uploadsPath } from 'api/files/filesystem';

import model from './filesModel';
import { validateFile } from './fileSchema';
import { FileSchema } from './fileType';

export const files = {
  async save(file: FileSchema) {
    return model.save(await validateFile(file));
  },

  get: model.get.bind(model),

  async delete(query: any = {}) {
    const toDeleteFiles: FileSchema[] = (await model.get(query)) || { filename: '' };

    await model.delete(query);

    await deleteFiles(toDeleteFiles.map(u => uploadsPath(u.filename || '')));

    return toDeleteFiles;
  },
};
