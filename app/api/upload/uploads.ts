import fs from 'fs';
import path from 'path';

import { ObjectIdSchema } from 'shared/types/commonTypes';

import paths from '../config/paths';
import model from './uploadsModel';
import { validateUpload } from './uploadSchema';
import { UploadSchema } from './uploadType';

const deleteFile = async (filename: string) =>
  new Promise((resolve, reject) => {
    fs.unlink(path.join(paths.customUploads, filename), err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });

export default {
  async save(upload: UploadSchema) {
    return model.save(await validateUpload(upload));
  },

  get: model.get.bind(model),

  async delete(_id: ObjectIdSchema) {
    const upload: UploadSchema = (await model.getById(_id)) || { filename: '' };

    await model.delete(_id);
    await deleteFile(upload.filename || '');

    return upload;
  },
};
