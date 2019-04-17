import path from 'path';
import ID from 'shared/uniqueID';
import { uploadDocumentsPath, customUploadsPath } from '../config/paths';

const storageConfig = {
  destination(req, file, cb) {
    const dir = req.route.path.includes('customisation') ?
      customUploadsPath : uploadDocumentsPath;
    cb(null, path.normalize(`${dir}/`));
  },
  filename(req, file, cb) {
    cb(null, Date.now() + ID() + path.extname(file.originalname));
  }
};

export default storageConfig;
