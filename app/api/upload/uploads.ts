import { deleteFiles, uploadsPath } from 'api/utils/files';

import model from './uploadsModel';
import { validateUpload } from './uploadSchema';
import { UploadSchema } from './uploadType';

export default {
  async save(upload: UploadSchema) {
    return model.save(await validateUpload(upload));
  },

  get: model.get.bind(model),

  async delete(query: any = {}) {
    const uploads: UploadSchema[] = (await model.get(query)) || { filename: '' };

    await model.delete(query);

    const files = uploads.map(u => uploadsPath(u.filename || ''));
    await deleteFiles(files);

    return uploads;
  },
};
