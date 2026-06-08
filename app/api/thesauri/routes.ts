/* eslint-disable max-statements */
import type { Application, NextFunction, Request, Response } from 'express';
import { uploadMiddleware } from '#api/files/index.js';

import { CreateThesaurusController } from '#api/core/infrastructure/express/thesaurus/CreateThesaurusController.js';
import { UpdateThesaurusController } from '#api/core/infrastructure/express/thesaurus/UpdateThesaurusController.js';
import { GetThesauriController } from '#api/core/infrastructure/express/thesaurus/GetThesauriController.js';
import { DeleteThesaurusController } from '#api/core/infrastructure/express/thesaurus/DeleteThesaurusController.js';
import { validation } from '../utils/index.js';
import needsAuthorization from '../auth/authMiddleware.js';
import thesauri from './thesauri.js';

const routes = (app: Application) => {
  app.post(
    '/api/thesauris',
    needsAuthorization(),

    uploadMiddleware(),

    async (req: Request, res: Response) => {
      const dto = req.file ? JSON.parse(req.body?.thesauri) : req.body;

      if (!dto?._id) {
        await CreateThesaurusController.createHandler()(req, res);
        return;
      }

      await UpdateThesaurusController.createHandler()(req, res);
    }
  );

  app.get(
    '/api/thesauris',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
          },
        },
      },
      required: ['query'],
    }),
    (req: Request<{}, {}, {}, { _id: string }>, res: Response, next: NextFunction) => {
      let id;
      if (req.query) {
        id = req.query._id;
      }
      thesauri
        .get(id, req.language, req.user)
        .then(response => res.json({ rows: response }))
        .catch(next);
    }
  );

  app.get('/api/dictionaries', GetThesauriController.createHandler());

  app.delete('/api/thesauris', needsAuthorization(), DeleteThesaurusController.createHandler());
};

export default routes;
export { routes };
