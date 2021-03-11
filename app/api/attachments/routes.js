import Joi from 'joi';
import createError from 'api/utils/Error';
import sanitize from 'sanitize-filename';

import entities from 'api/entities';
import { files } from 'api/files';
import path from 'path';
import { attachmentsPath } from 'api/files/filesystem';

import { validation } from '../utils';

export default app => {
  app.get(
    '/api/attachments/download',

    validation.validateRequest(
      Joi.object({
        _id: Joi.objectId().required(),
        file: Joi.string().required(),
      }).required(),
      'query'
    ),

    async (req, res, next) => {
      try {
        const entity = await entities.getById(req.query._id);
        if (!entity) {
          throw createError('entity does not exists', 404);
        }
        const [attachment] = await files.get({ entity: entity.sharedId, filename: req.query.file });
        if (!attachment) {
          throw createError('file not found', 404);
        }

        const newName =
          path.basename(attachment.originalname, path.extname(attachment.originalname)) +
          path.extname(attachment.filename);

        res.download(attachmentsPath(attachment.filename), sanitize(newName));
      } catch (e) {
        next(e);
      }
    }
  );
};
