import path from 'path';
import { uploadDocumentsPath, customUploadsPath } from '../config/paths';
import { generateFileName } from 'api/utils/files';


const storageConfig = {
  destination(req, file, cb) {
    const dir = req.route.path.includes('customisation') ?
      customUploadsPath : uploadDocumentsPath;
    cb(null, path.normalize(`${dir}/`));
  },
  filename(req, file, cb) {
    cb(null, generateFileName(file));
  }
};

export default storageConfig;
