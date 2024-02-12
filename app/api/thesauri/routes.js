import { CSVLoader } from 'api/csv';
import { uploadMiddleware } from 'api/files';

import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import thesauri from './thesauri';

const routes = app => {
  app.post(
    '/api/thesauris',
    needsAuthorization(),

    uploadMiddleware(),

    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          anyOf: [
            {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                __v: { type: 'number' },
                name: { type: 'string' },
                enable_classification: { type: 'boolean' },
                values: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      _id: { type: 'string' },
                      label: { type: 'string' },
                      values: { type: 'array', items: { type: 'object' } },
                    },
                    required: ['label'],
                  },
                },
              },
              required: ['name', 'values'],
            },
            {
              type: 'object',
              properties: {
                thesauri: { type: 'string' },
              },
              required: ['thesauri'],
            },
          ],
        },
      },
      required: ['body'],
    }),
    async (req, res, next) => {
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
