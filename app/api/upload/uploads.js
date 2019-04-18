import fs from 'fs';
import path from 'path';

import { customUploadsPath } from '../config/paths';
import model from './uploadsModel';

const deleteFile = filename => new Promise((resolve, reject) => {
  fs.unlink(path.join(customUploadsPath, filename), (err) => {
    if (err) {
      reject(err);
    }
    resolve();
  });
});

export default {
  save: model.save.bind(model),

  get: model.get.bind(model),

  async delete(_id) {
    const upload = await model.getById(_id);

    await model.delete(_id);
    await deleteFile(upload.filename);

    return upload;
  }
};
