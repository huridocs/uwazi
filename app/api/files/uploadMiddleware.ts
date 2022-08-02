import path from 'path';
import { fs, generateFileName } from 'api/files';
import { Request, Response, NextFunction } from 'express';
import { errorLog } from 'api/log/errorLog';
import { tenants } from 'api/tenants';

import multer from 'multer';
import { FileType } from 'shared/types/fileType';
import { _storeFile } from './storage';

type multerCallback = (error: Error | null, destination: string) => void;

const defaultStorage = multer.diskStorage({
  filename(_req: Request, file: Express.Multer.File, cb: multerCallback) {
    cb(null, generateFileName(file));
  },
});

const processOriginalFileName = (req: Request) => {
  if (req.body.filename) {
    return req.body.filename;
  }

  errorLog.debug(
    // eslint-disable-next-line max-len
    `[${tenants.current.name}] Deprecation warning: providing the filename in the multipart header is deprecated and will stop working in the future. Include a 'filename' field in the body instead.`
  );

  return req.file?.originalname;
};

const singleUpload =
  (type?: FileType['type'], storage: multer.StorageEngine = defaultStorage) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await new Promise<void>((resolve, reject) => {
        multer({ storage }).single('file')(req, res, err => {
          if (!err) resolve();
          reject(err);
        });
      });
      if (req.file) {
        req.file.originalname = processOriginalFileName(req);
      }
      if (type) {
        await _storeFile(
          req.file.filename,
          fs.createReadStream(path.join(req.file.destination, req.file.filename)),
          type
        );
      }
      next();
    } catch (e) {
      next(e);
    }
  };

const multipleUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await new Promise<void>((resolve, reject) => {
      multer().any()(req, res, err => {
        if (!err) resolve();
        reject(err);
      });
    });
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * accepts a single file and stores it based on type
 * @param type is optional, when undefined the file will be stored on the os tmp default dir
 */
const uploadMiddleware = (type?: FileType['type']) => singleUpload(type, defaultStorage);

/**
 * accepts multiple files and places them in req.files array
 * files will not be stored on disk and will be on a buffer on each element of the array.
 */
uploadMiddleware.multiple = () => multipleUpload;

uploadMiddleware.customStorage = (storage: multer.StorageEngine, type?: FileType['type']) =>
  singleUpload(type, storage);

export { uploadMiddleware };
