import path from 'path';
import { fs, generateFileName, pathFunction, deleteFile } from 'api/files';
import { Request, Response, NextFunction } from 'express';
import multer, { StorageEngine } from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

type multerCallback = (error: Error | null, destination: string) => void;

const defaultStorage = multer.diskStorage({
  filename(_req: Request, file: Express.Multer.File, cb: multerCallback) {
    cb(null, generateFileName(file));
  },
});

const move = async (req: Request, filePath: pathFunction) => {
  if (!req.file) {
    return;
  }
  const oldPath = path.join(req.file.destination, req.file.filename);
  const newPath = filePath(req.file.filename);
  await fs.copyFile(oldPath, newPath);
  await deleteFile(oldPath);
  req.file.destination = filePath();
  req.file.path = filePath(req.file.filename);
};

const singleUpload =
  (filePath?: pathFunction, storage: multer.StorageEngine = defaultStorage) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await new Promise<void>((resolve, reject) => {
        multer({ storage }).single('file')(req, res, err => {
          if (!err) resolve();
          reject(err);
        });
      });
      req.file.filename = req.file.key;

      // if (filePath) {
      //   await move(req, filePath);
      // }
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
 * accepts a single file and moves it to the path provided by path function
 * @param pathFunction is optional, when undefined the file will be stored on the os tmp default dir
 */
const uploadMiddleware = (filePath?: pathFunction, storage?: StorageEngine) => {
  const s3 = new S3Client({
    apiVersion: 'latest',
    region: 'greenhost',
    endpoint: 'https://store.greenhost.net',
    credentials: { accessKeyId: '25GIOIR4BHE759AD5XLI', secretAccessKey: 'NMQcbQGOfXYmueT4gnHwkBMmm7BC34He2kCk4Bdb' }});
  const _storage = multerS3({
    s3: s3,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    bucket: 'uwazi-development',
    key(_req: Request, file: Express.Multer.File, cb: multerCallback) {
      cb(null, generateFileName(file));
    },
  })
  return singleUpload(filePath, _storage);
}

/**
 * accepts multiple files and places them in req.files array
 * files will not be stored on disk and will be on a buffer on each element of the array.
 */
uploadMiddleware.multiple = () => multipleUpload;

export { uploadMiddleware };
