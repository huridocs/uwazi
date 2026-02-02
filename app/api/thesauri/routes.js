/* eslint-disable max-statements */
import { uploadMiddleware } from '#api/files/index.js';

import { CreateThesaurusController } from '#api/core/infrastructure/express/thesaurus/CreateThesaurusController.js';
import { UpdateThesaurusController } from '#api/core/infrastructure/express/thesaurus/UpdateThesaurusController.js';
import { tenants } from '#api/tenants/index.js';
import { CSVLoader } from '#api/csv/index.js';
import needsAuthorization from '../auth/authMiddleware.js';
import { validation } from '../utils/index.js';
import thesauri from './thesauri.js';

const routes = app => {
  app.post(
    '/api/thesauris',
    needsAuthorization(),

    uploadMiddleware(),

    async (req, res, next) => {
      const dto = req.file ? JSON.parse(req.body?.thesauri) : req.body;

      if (!dto?._id) {
        await CreateThesaurusController.createHandler()(req, res);
        return;
      }

      if (tenants.current()?.featureFlags?.v2UpdateThesaurus && dto?._id) {
        await UpdateThesaurusController.createHandler()(req, res);
        return;
      }

      try {
        const data = req.file ? JSON.parse(req.body.thesauri) : req.body;
        let response = await thesauri.save(data);
        if (req.file) {
          const loader = new CSVLoader();
          response = await loader.loadThesauri(req.file.path, response._id, {
            language: req.language,
          });
        }
        res.json(response);
        req.sockets.emitToCurrentTenant('thesauriChange', response);
      } catch (e) {
        next(e);
      }
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
    (req, res, next) => {
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

  app.get('/api/thesauri', (req, res, next) => {
    const input = req?.query?._id ? { _id: req.query._id } : undefined;

    thesauri
      .find(input)
      .then(output => res.json(output))
      .catch(next);
  });

  app.get(
    '/api/dictionaries',
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
    (req, res, next) => {
      let id;
      if (req.query && req.query._id) {
        id = { _id: req.query._id };
      }
      thesauri
        .dictionaries(id)
        .then(response => res.json({ rows: response }))
        .catch(next);
    }
  );

  app.delete(
    '/api/thesauris',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            _rev: {
              type: 'string',
            },
          },
          required: ['_id'],
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      thesauri
        .delete(req.query._id, req.query._rev)
        .then(response => {
          res.json(response);
          req.sockets.emitToCurrentTenant('thesauriDelete', response);
        })
        .catch(next);
    }
  );
};

export default routes;
export { routes };
