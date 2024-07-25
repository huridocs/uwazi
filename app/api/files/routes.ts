import { Application, Request } from 'express';

import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import needsAuthorization from 'api/auth/authMiddleware';
import { CSVLoader } from 'api/csv';
import entities from 'api/entities';
import { processDocument } from 'api/files/processDocument';
import { uploadMiddleware } from 'api/files/uploadMiddleware';
import { legacyLogger } from 'api/log';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { EntitySchema } from 'shared/types/entityType';
import { fileSchema } from 'shared/types/fileSchema';
import { FileType } from 'shared/types/fileType';
import { UserSchema } from 'shared/types/userType';
import { createError, handleError, validation } from '../utils';
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

export default (app: Application) => {
  app.post(
    '/api/files/upload/document',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    uploadMiddleware('document'),
    async (req, res) => {
      if (!req.file) throw new Error('File is not available on request object');
      try {
        req.emitToSessionSocket('conversionStart', req.body.entity);
        const savedFile = await processDocument(req.body.entity, req.file);
        res.json(savedFile);
        req.emitToSessionSocket('documentProcessed', req.body.entity);
      } catch (err) {
        legacyLogger.error(err);
        legacyLogger.debug(err);
        const [file] = await files.get({ filename: req.file.filename });
        res.json(file);
        req.emitToSessionSocket('conversionFailed', req.body.entity);
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

      if (
        !file?.filename ||
        !file?.type ||
        !(await storage.fileExists(file.filename, file.type)) ||
        !(await checkEntityPermission(file, permissionsContext.getUserInContext()))
      ) {
        throw createError('file not found', 404);
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
      (await storage.readableFile(file.filename, file.type)).pipe(res);
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

      const [deletedFile] = await files.delete({ _id: req.query._id });
      const thumbnailFileName = `${deletedFile._id}.jpg`;
      await files.delete({ filename: thumbnailFileName });
      res.json([deletedFile]);
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
