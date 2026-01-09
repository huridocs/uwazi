/* eslint-disable max-lines */
import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import needsAuthorization from 'api/auth/authMiddleware';
import { DownloadFileController } from 'api/core/infrastructure/express/DownloadFileController';
import { DocumentUploadController } from 'api/core/infrastructure/express/files/DocumentUploadController';
import { FileDeleteController } from 'api/core/infrastructure/express/files/FileDeleteController';
import { UploadMiddleware } from 'api/core/infrastructure/express/middlewares/UploadMiddleware';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import entities from 'api/entities';
import { convertPDF, createProcessingFile } from 'api/files/processDocument';
import { uploadMiddleware } from 'api/files/uploadMiddleware';
import { permissionsContext } from 'api/permissions/permissionsContext';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { withTransaction } from 'api/utils/withTransaction';
import { Application, Request, Response } from 'express';
import { EntitySchema } from 'shared/types/entityType';
import { fileSchema } from 'shared/types/fileSchema';
import { FileType } from 'shared/types/fileType';
import { UserSchema } from 'shared/types/userType';
import { pipeline } from 'stream/promises';
import { createError, validation } from '../utils';
import { files } from './files';
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

const timestampToHTTPDate = (timestamp: number): string => new Date(timestamp).toUTCString();

async function addFileCacheHeaders(res: Response, file: FileType, currentUser?: UserSchema) {
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
}

function addContentHeaders(
  res: Response,
  req: Request<{ filename: string }, {}, {}, { download?: boolean }, Record<string, any>>,
  headerFilename: string,
  mimetype?: string
) {
  res.setHeader('Content-Disposition', `filename*=UTF-8''${encodeURIComponent(headerFilename)}`);

  if (req.query.download === true) {
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(headerFilename)}`
    );
  }
  res.setHeader('Content-Type', mimetype || 'application/octet-stream');
}

// eslint-disable-next-line max-statements
export default (app: Application) => {
  app.post(
    '/api/files/upload/document',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    async (req, res, next) => {
      if (tenants.current().featureFlags?.v2UploadFile) {
        await new UploadMiddleware(LoggerFactory.default()).singleUpload('document')(
          req,
          res,
          next
        );
      } else {
        await uploadMiddleware('document')(req, res, next);
      }
    },
    async (req, res) => {
      req.emitToSessionSocket('conversionStart', req.body.entity);
      if (tenants.current().featureFlags?.v2UploadFile) {
        await DocumentUploadController.createHandler()(req, res);
      } else {
        if (!req.file) {
          throw new Error('File is not available on request object');
        }
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

  // app.use('/assets/:fileName', (req, res) => {
  //   res.redirect(301, `/api/files/${req.params.fileName}`);
  // });

  const checkFilePermissions = async (file: FileType) =>
    checkEntityPermission(file, permissionsContext.getUserInContext());

  app.get(
    '/assets/:filename',
    DownloadFileController.customHandler(['custom'], checkFilePermissions, isFilePubliclyAccessible)
  );
  app.get(
    '/files/thumbnails/:filename',
    DownloadFileController.customHandler(
      ['thumbnail'],
      checkFilePermissions,
      isFilePubliclyAccessible
    )
  );
  app.get(
    '/files/:filename',
    DownloadFileController.customHandler(
      ['document', 'attachment'],
      checkFilePermissions,
      isFilePubliclyAccessible
    )
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

      await addFileCacheHeaders(res, file, currentUser);
      addContentHeaders(res, req, file.originalname || file.filename, file.mimetype);

      const stream = await storage.readableFile(file.filename, file.type);

      res.on('close', () => {
        stream.destroy();
      });

      await pipeline(stream, res);
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
      const [fileToDelete] = await files.get({ _id: req.query._id });
      if (
        !fileToDelete ||
        !(await checkEntityPermission(fileToDelete, permissionsContext.getUserInContext(), 'write'))
      ) {
        throw createError('file not found', 404);
      }

      if (tenants.current().featureFlags?.v2DeleteFile) {
        await FileDeleteController.createHandler()(req, res);
      } else {
        await withTransaction(async () => {
          const [deletedFile] = await files.delete({ _id: req.query._id });
          const thumbnailFileName = `${deletedFile._id}.jpg`;
          await files.delete({ filename: thumbnailFileName });
          res.json([deletedFile]);
        }, 'DELETE /api/files');
      }
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
};
