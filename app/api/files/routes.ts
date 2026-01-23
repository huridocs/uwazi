import { Application, Request } from 'express';

import activitylogMiddleware from '#api/activitylog/activitylogMiddleware.js';
import needsAuthorization from '#api/auth/authMiddleware.js';
import entities from '#api/entities/index.js';
import { createProcessingFile, convertPDF } from '#api/files/processDocument.js';
import { uploadMiddleware } from '#api/files/uploadMiddleware.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { fileSchema } from '#shared/types/fileSchema.js';
import { FileType } from '#shared/types/fileType.js';
import { UserSchema } from '#shared/types/userType.js';
import { createError, validation } from '#api/utils/index.js';
import { files } from '#api/files/files.js';
import { withTransaction } from '#api/utils/withTransaction.js';
import { DownloadFileController } from '#api/core/infrastructure/express/DownloadFileController.js';
import { DocumentUploadController } from '#api/core/infrastructure/express/files/DocumentUploadController.js';
import { FileDeleteController } from '#api/core/infrastructure/express/files/FileDeleteController.js';
import { tenants } from '#api/tenants/index.js';
import { UploadMiddleware } from '#api/core/infrastructure/express/middlewares/UploadMiddleware.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';

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

  app.get('/assets/:filename', DownloadFileController.customHandler(['custom']));
  app.get('/files/thumbnails/:filename', DownloadFileController.customHandler(['thumbnail']));
  app.get('/files/:filename', DownloadFileController.customHandler(['document', 'attachment']));

  // Deprecated routes, keeping for Backwards compatibility
  app.use('/uploaded_documents/:fileName', (req, res) => {
    res.redirect(301, `/api/files/${req.params.fileName}`);
  });
  app.get('/api/attachments/download', async (req, res) => {
    res.redirect(301, `/api/files/${req.query.file}?download=true`);
  });
  app.get(
    '/api/files/:filename',
    DownloadFileController.customHandler(['custom', 'document', 'attachment', 'thumbnail'])
  );
  // Deprecated routes, keeping for Backwards compatibility

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
      if (tenants.current().featureFlags?.v2DeleteFile) {
        await FileDeleteController.createHandler()(req, res);
      } else {
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
