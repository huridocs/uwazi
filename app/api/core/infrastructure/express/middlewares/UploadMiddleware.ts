import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { Logger } from 'api/core/libs/logger/contracts/Logger';
import { generateFileName } from 'api/files';
import { InputFile } from 'api/core/infrastructure/files/InputFile';
import { tenants } from 'api/tenants';
import { TimedMethod } from 'api/core/libs/logger/TimedMethodDecorator';

type multerCallback = (error: Error | null, destination: string) => void;

declare module 'express-serve-static-core' {
  interface Request {
    inputFile?: InputFile;
    inputFiles?: InputFile[];
  }
}

const getFieldAndIndex = (fieldname: string) => {
  const [field, index] = fieldname.replace(']', '').split('[');
  return field && index && { field, index: parseInt(index, 10) };
};

class UploadMiddleware {
  private tmpStorage: multer.StorageEngine;

  private logger: Logger;

  constructor(logger: Logger, nameGenerator: typeof generateFileName = generateFileName) {
    this.logger = logger;
    this.tmpStorage = multer.diskStorage({
      filename(_req, file: Express.Multer.File, cb: multerCallback) {
        try {
          cb(null, nameGenerator(file));
        } catch (e) {
          cb(e, '');
        }
      },
    });
  }

  private processOriginalFileName(file: Express.Multer.File, req: Request, single: boolean) {
    if (req.body.originalname && single) {
      return req.body.originalname as string;
    }

    if (!single) {
      const fileField = getFieldAndIndex(file.fieldname);
      const originalnameInBody = fileField
        ? req.body[`${fileField.field}_originalname`]?.[fileField.index]
        : false;
      if (originalnameInBody) {
        return originalnameInBody;
      }
    }

    this.logger.debug(
      `[${
        tenants.current().name
        // eslint-disable-next-line max-len
      }] Deprecation warning: providing the filename in the multipart header is deprecated and will stop working in the future. Include an 'originalname' field in the body instead.`
    );

    return file.originalname;
  }

  singleUpload(type: 'document' | 'attachment') {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await new Promise<void>((resolve, reject) => {
          multer({ storage: this.tmpStorage }).single('file')(req, res, err => {
            if (!err) resolve();
            reject(err);
          });
        });
        if (req.file) {
          req.inputFile = new InputFile(
            {
              ...req.file,
              originalname: this.processOriginalFileName(req.file, req, true),
            },
            type
          );
        }
        next();
      } catch (e) {
        next(e);
      }
    };
  }

  // @TimedMethod('upload_middleware_multiple')
  multiple() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await new Promise<void>((resolve, reject) => {
          multer({ storage: this.tmpStorage }).any()(req, res, err => {
            if (!err) resolve();
            reject(err);
          });
        });
        if (Array.isArray(req.files)) {
          req.inputFiles = req.files.map(
            f =>
              new InputFile(
                {
                  ...f,
                  originalname: this.processOriginalFileName(f, req, false),
                },
                f.fieldname.match('document') ? 'document' : 'attachment'
              )
          );
        }
        next();
      } catch (e) {
        next(e);
      }
    };
  }
}

export { UploadMiddleware };
