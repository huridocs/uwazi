import path from 'path';
import { generateFileName } from 'api/utils/files';
import configPaths from '../config/paths';


const storageConfig = {
  destination(req, file, cb) {
    const dir = req.route.path.includes('customisation') ?
      configPaths.customUploads : configPaths.uploadedDocuments;
    cb(null, path.normalize(`${dir}/`));
  },
  filename(req, file, cb) {
    cb(null, generateFileName(file));
  }
};

export default storageConfig;
