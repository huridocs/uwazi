import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import needsAuthorization from 'api/auth/authMiddleware';
import { FileUploadUseCaseFactory } from 'api/core/infrastructure/factories/FileUploadUseCaseFactory';
import { CSVLoader } from 'api/csv';
import entities from 'api/entities';
import { InputFile } from 'api/files.v2/model/InputFile';
import { convertPDF, createProcessingFile } from 'api/files/processDocument';
import { uploadMiddleware } from 'api/files/uploadMiddleware';
import { permissionsContext } from 'api/permissions/permissionsContext';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { withTransaction } from 'api/utils/withTransaction';
import { Application, Request } from 'express';
import multer from 'multer';
import { EntitySchema } from 'shared/types/entityType';
import { fileSchema } from 'shared/types/fileSchema';
import { FileType } from 'shared/types/fileType';
import { UserSchema } from 'shared/types/userType';
import { createError, handleError, validation } from '../utils';
import { files } from './files';
import { generateFileName } from './filesystem';
import { storage } from './storage';

const checkEntityPermission = async (
  file: FileType,
  user: UserSchema | undefined,
  level: 'read' | 'write' = 'read'
): Promise<boolean> => {
  if (['admin'].includes(user?.role || '')) return true;
  const [fileInDB] = await files.get({ _id: file._id });

  if (!fileInDB || (fileInDB.type === 'custom' && level === 'write')) {
    return false;
  }

  if (fileInDB.type === 'custom' && level === 'read') {
    return true;
  }

  const relatedEntities: EntitySchema[] = await entities.get(
    { sharedId: fileInDB.entity },
    '_id, permissions',
    { withoutDocuments: true }
  );

  if (level === 'read') {
    return relatedEntities.length > 0;
  }

  return (
    relatedEntities.length > 0 &&
    relatedEntities.every(
      entity =>
        !!(entity.permissions || []).find(
          permission =>
            permission.refId.toString() === user?._id?.toString() && permission.level === 'write'
        )
    )
  );
};

const filterByEntityPermissions = async (fileList: FileType[]): Promise<FileType[]> => {
  const sharedIds = fileList.map(f => f.entity).filter(f => f);
  const allowedSharedIds = await entities
    .get({ sharedId: { $in: sharedIds } }, 'sharedId', {
      withoutDocuments: true,
    })
    .then((arr: { sharedId: string }[]) => new Set(arr.map(e => e.sharedId)));
  return fileList.filter(f => !f.entity || allowedSharedIds.has(f.entity));
};

const isFilePubliclyAccessible = async (
  file: FileType,
  isPrivateInstance: boolean
): Promise<boolean> => {
  if (isPrivateInstance) {
    return false;
  }

  if (file.type === 'custom') {
    return true;
  }

  if (!file.entity) {
    return false;
  }

  const relatedEntities: EntitySchema[] = await entities.get(
    { sharedId: file.entity },
    'published',
    { withoutDocuments: true }
  );
  return relatedEntities.length > 0 && relatedEntities.every(entity => entity.published === true);
};

const getCacheControlHeader = (
  isPubliclyAccessible: boolean,
  isPrivateInstance: boolean
): string => {
  if (isPrivateInstance) {
    return 'private, max-age=3600';
  }

  if (isPubliclyAccessible) {
    return 'public, no-cache';
  }

  return 'private, max-age=3600';
};

const timestampToHTTPDate = (timestamp: number): string => {
  return new Date(timestamp).toUTCString();
};

// eslint-disable-next-line max-statements
export default (app: Application) => {
  app.post(
    '/api/files/upload/document',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    async (req, res, next) => {
      if (tenants.current().featureFlags?.v2UploadFile) {
        const defaultStorage = multer.diskStorage({
          filename(_req, file: Express.Multer.File, cb) {
            cb(null, generateFileName(file));
          },
        });
        await new Promise<void>((resolve, reject) => {
          multer({ storage: defaultStorage }).single('file')(req, res, err => {
            if (!err) resolve();
            reject(err);
          });
        });
        next();
      } else {
        await uploadMiddleware('document')(req, res, next);
      }
    },
    async (req, res) => {
      if (!req.file) throw new Error('File is not available on request object');
      req.emitToSessionSocket('conversionStart', req.body.entity);
      if (tenants.current().featureFlags?.v2UploadFile) {
        const savedFile = await FileUploadUseCaseFactory.default().execute({
          uploadedFile: new InputFile(req.file),
          entityId: req.body.entity,
        });
        res.json(savedFile);
      } else {
        const savedFile = await createProcessingFile(req.body.entity, req.file);
        res.json(savedFile);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        convertPDF(
          savedFile,
          req.body.entity,
          req.file,
          true,
          processedFile => {
            req.emitToSessionSocket('documentProcessed', req.body.entity, processedFile);
          },
          (_e, failedFile) => {
            req.emitToSessionSocket('conversionFailed', req.body.entity, failedFile);
          }
        );
      }
    },
    activitylogMiddleware
  );

  app.post(
    '/api/files/upload/custom',
    needsAuthorization(['admin']),
    uploadMiddleware('custom'),
    activitylogMiddleware,
    (req, res, next) => {
      files
        .save({ ...req.file, type: 'custom' })
        .then(saved => {
          res.json(saved);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/files/upload/attachment',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    uploadMiddleware('attachment'),
    activitylogMiddleware,
    (req, res, next) => {
      files
        .save({
          ...req.file,
          ...req.body,
          type: 'attachment',
        })
        .then(saved => {
          res.json(saved);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/files',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: fileSchema,
      },
    }),
    async (req, res) => {
      if (
        !(await checkEntityPermission(req.body, permissionsContext.getUserInContext(), 'write'))
      ) {
        throw createError('file not found', 404);
      }
      const result = await files.save(req.body);
      res.json(result);
    }
  );

  app.post(
    '/api/files/tocReviewed',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          required: ['fileId'],
          properties: {
            fileId: { type: 'string' },
          },
        },
      },
    }),
    async (req, res, next) => {
      try {
        res.json(await files.tocReviewed(req.body.fileId, req.language));
      } catch (e) {
        next(e);
      }
    }
  );

  app.use('/assets/:fileName', (req, res) => {
    res.redirect(301, `/api/files/${req.params.fileName}`);
  });

  app.use('/uploaded_documents/:fileName', (req, res) => {
    res.redirect(301, `/api/files/${req.params.fileName}`);
  });

  app.get(
    '/api/attachments/download',

    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          properties: {
            _id: { type: 'string' },
            file: { type: 'string' },
          },
          required: ['file'],
        },
      },
      required: ['query'],
    }),

    async (req, res) => {
      res.redirect(301, `/api/files/${req.query.file}?download=true`);
    }
  );

  app.get(
    '/api/files/:filename',
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        params: {
          type: 'object',
          required: ['filename'],
          properties: {
            filename: { type: 'string' },
          },
        },
        query: {
          type: 'object',
          properties: {
            download: { type: 'boolean' },
          },
        },
      },
    }),

    async (req: Request<{ filename: string }, {}, {}, { download?: boolean }>, res) => {
      const [file] = await files.get({
        filename: req.params.filename,
      });

      const currentUser = permissionsContext.getUserInContext();

      if (
        !file?.filename ||
        !file?.type ||
        !(await storage.fileExists(file.filename, file.type)) ||
        !(await checkEntityPermission(file, currentUser))
      ) {
        throw createError('file not found', 404);
      }

      // Set cache control and Last-Modified headers (only if feature flag is enabled)
      if (tenants.current().featureFlags?.fileCacheHeaders) {
        if (currentUser) {
          res.setHeader('Cache-Control', 'private, max-age=3600');
        } else {
          const appSettings = await settings.get();
          const isPrivateInstance = appSettings.private || false;

          const isPublic = await isFilePubliclyAccessible(file, isPrivateInstance);

          const cacheControl = getCacheControlHeader(isPublic, isPrivateInstance);
          res.setHeader('Cache-Control', cacheControl);
        }

        if (file.creationDate) {
          const lastModified = timestampToHTTPDate(file.creationDate);
          res.setHeader('Last-Modified', lastModified);
        }
      }

      const headerFilename = file.originalname || file.filename;
      res.setHeader(
        'Content-Disposition',
        `filename*=UTF-8''${encodeURIComponent(headerFilename)}`
      );

      if (req.query.download === true) {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(headerFilename)}`
        );
      }

      res.setHeader('Content-Type', file?.mimetype || 'application/octet-stream');
      const stream = await storage.readableFile(file.filename, file.type);
      res.on('close', () => {
        stream.destroy();
      });
      stream.pipe(res);
    }
  );

  app.delete(
    '/api/files',
    needsAuthorization(['admin', 'editor', 'collaborator']),

    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          required: ['_id'],
          additionalProperties: false,
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request<{}, {}, {}, { _id: string }>, res) => {
      await withTransaction(async () => {
        const [fileToDelete] = await files.get({ _id: req.query._id });
        if (
          !fileToDelete ||
          !(await checkEntityPermission(
            fileToDelete,
            permissionsContext.getUserInContext(),
            'write'
          ))
        ) {
          throw createError('file not found', 404);
        }

        const [deletedFile] = await files.delete({ _id: req.query._id });
        const thumbnailFileName = `${deletedFile._id}.jpg`;
        await files.delete({ filename: thumbnailFileName });
        res.json([deletedFile]);
      }, 'DELETE /api/files');
    }
  );

  app.get(
    '/api/files',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          properties: {
            _id: { type: 'string' },
            type: { type: 'string' },
          },
        },
      },
    }),
    async (req, res) => {
      res.json(await filterByEntityPermissions(await files.get(req.query)));
    }
  );

  app.post(
    '/api/import',

    needsAuthorization(['admin']),

    uploadMiddleware(),

    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          required: ['template'],
          properties: {
            template: { type: 'string' },
          },
        },
      },
    }),

    (req, res) => {
      if (!req.file) throw new Error('File is not available on request object');

      const loader = new CSVLoader();
      let loaded = 0;

      loader.on('entityLoaded', () => {
        loaded += 1;
        req.emitToSessionSocket('IMPORT_CSV_PROGRESS', loaded);
      });

      loader.on('rowExceptions', exceptions => {
        req.emitToSessionSocket('IMPORT_CSV_ROW_EXCEPTIONS', exceptions);
      });

      loader.on('loadError', error => {
        req.emitToSessionSocket('IMPORT_CSV_ERROR', handleError(error));
      });

      req.emitToSessionSocket('IMPORT_CSV_START');

      loader
        .load(req.file.path, req.body.template, { language: req.language, user: req.user })
        .then(() => {
          req.emitToSessionSocket('IMPORT_CSV_END');
        })
        .catch((e: Error) => {
          req.emitToSessionSocket('IMPORT_CSV_ERROR', handleError(e));
        });

      res.json('ok');
    }
  );
};
