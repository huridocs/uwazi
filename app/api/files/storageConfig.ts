import path from 'path';
import { customUploadsPath, uploadsPath, generateFileName } from 'api/files/filesystem';
import { Request } from 'express';

type multerCallback = (error: Error | null, destination: string) => void;

const storageConfig = {
  destination(req: Request, _file: Express.Multer.File, cb: multerCallback) {
    const dir = req.route.path.includes('custom') ? customUploadsPath() : uploadsPath();
    cb(null, path.normalize(`${dir}/`));
  },
  filename(_req: Request, file: Express.Multer.File, cb: multerCallback) {
    cb(null, generateFileName(file));
  },
};

export default storageConfig;
