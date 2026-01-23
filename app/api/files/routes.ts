/* eslint-disable max-lines */
import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import needsAuthorization from 'api/auth/authMiddleware';
import { DownloadFileController } from 'api/core/infrastructure/express/DownloadFileController';
import { EntityFileUploadController } from 'api/core/infrastructure/express/files/EntityFileUploadController';
import { FileDeleteController } from 'api/core/infrastructure/express/files/FileDeleteController';
import { UploadMiddleware } from 'api/core/infrastructure/express/middlewares/UploadMiddleware';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import entities from 'api/entities';
import { convertPDF, createProcessingFile } from 'api/files/processDocument';
import { uploadMiddleware } from 'api/files/uploadMiddleware';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { withTransaction } from 'api/utils/withTransaction';
import { Application, Request } from 'express';
import { EntitySchema } from 'shared/types/entityType';
import { fileSchema } from 'shared/types/fileSchema';
import { FileType } from 'shared/types/fileType';
import { UserSchema } from 'shared/types/userType';
import { createError, validation } from '../utils';
import { files } from './files';

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
      await new UploadMiddleware(LoggerFactory.default()).singleUpload('document')(req, res, next);
    },
    async (req, res) => {
      req.emitToSessionSocket('conversionStart', req.body.entity);
      await EntityFileUploadController.forDocument()(req, res);
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
    async (req, res, next) => {
      await new UploadMiddleware(LoggerFactory.default()).singleUpload('attachment')(
        req,
        res,
        next
      );
    },
    async (req, res) => {
      await EntityFileUploadController.forAttachment()(req, res);
    },
    activitylogMiddleware
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
