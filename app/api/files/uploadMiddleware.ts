import fs from 'fs';
import path from 'path';
import { generateFileName, pathFunction } from 'api/files/filesystem';
import { Request, Response, NextFunction } from 'express';
import multer, { StorageEngine } from 'multer';
import { promisify } from 'util';

type multerCallback = (error: Error | null, destination: string) => void;

const copyFile = promisify(fs.copyFile);
const removeFile = promisify(fs.unlink);

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
  await copyFile(oldPath, newPath);
  await removeFile(oldPath);
  req.file.destination = filePath();
  req.file.path = filePath(req.file.filename);
};

const singleUpload = (filePath?: pathFunction, storage = defaultStorage) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await new Promise((resolve, reject) => {
      multer({ storage }).single('file')(req, res, err => {
        if (!err) resolve();
        reject(err);
      });
    });

    if (filePath) {
      await move(req, filePath);
    }
    next();
  } catch (e) {
    next(e);
  }
};

const multipleUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await new Promise((resolve, reject) => {
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
const uploadMiddleware = (filePath?: pathFunction, storage?: StorageEngine) =>
  singleUpload(filePath, storage);

/**
 * accepts multiple files and places them in req.files array
 * files will not be stored on disk and will be on a buffer on each element of the array.
 */
uploadMiddleware.multiple = () => multipleUpload;

export { uploadMiddleware };
