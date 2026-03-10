import { generateFileName } from 'api/files';
import { tenants } from 'api/tenants';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { FileType } from 'shared/types/fileType';
import { legacyLogger } from 'api/log';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { storage } from './storage';

type multerCallback = (error: Error | null, destination: string) => void;

const defaultStorage = multer.diskStorage({
  filename(_req, file: Express.Multer.File, cb: multerCallback) {
    cb(null, generateFileName(file));
  },
});

const processOriginalFileName = (req: Request) => {
  if (req.body.originalname) {
    return req.body.originalname;
  }

  legacyLogger.debug(
    `[${
      tenants.current().name
      // eslint-disable-next-line max-len
    }] Deprecation warning: providing the filename in the multipart header is deprecated and will stop working in the future. Include an 'originalname' field in the body instead.`
  );

  return req.file?.originalname;
};

const singleUpload =
  (type?: FileType['type'], tmpStorage: multer.StorageEngine = defaultStorage) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await new Promise<void>((resolve, reject) => {
        multer({ storage: tmpStorage }).single('file')(req, res, err => {
          if (!err) resolve();
          reject(err);
        });
      });
      if (req.file) {
        req.file.originalname = processOriginalFileName(req);
      }
      if (type && req.file) {
        await storage.storeFile(
          req.file.filename,
          createReadStream(path.join(req.file.destination, req.file.filename)),
          type
        );
      }
      next();
    } catch (e) {
      next(e);
    }
  };

const getFieldAndIndex = (fieldname: string) => {
  const fieldAndIndexPattern = /([a-zA-Z0-9]+)\[([0-9]+)\]/g;
  const groups = fieldAndIndexPattern.exec(fieldname);
  return groups && { field: groups[1], index: parseInt(groups[2], 10) };
};

const applyFilesOriginalnames = (req: Request) => {
  if (req.files) {
    (req.files as Express.Multer.File[]).forEach(file => {
      const fileField = getFieldAndIndex(file.fieldname);
      if (fileField) {
        const originalnameInBody = req.body[`${fileField.field}_originalname`]?.[fileField.index];
        if (originalnameInBody) {
          // eslint-disable-next-line no-param-reassign
          file.originalname = originalnameInBody;
        } else {
          legacyLogger.error(
            `[${
              tenants.current().name
              // eslint-disable-next-line max-len
            }] Deprecation warning: relying on the filename in the multipart header is deprecated and will stop working in the future. Include an '${
              fileField.field
            }_originalname[${fileField.index}]' field in the body instead.`
          );
        }
      }
    });
  }
};

const multipleUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await new Promise<void>((resolve, reject) => {
      multer({ storage: defaultStorage }).any()(req, res, err => {
        if (err) reject(err);
        resolve();
      });
    });
    applyFilesOriginalnames(req);
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

uploadMiddleware.customStorage = (tmpStorage: multer.StorageEngine, type?: FileType['type']) =>
  singleUpload(type, tmpStorage);

export { uploadMiddleware };
