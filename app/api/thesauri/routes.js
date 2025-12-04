/* eslint-disable max-statements */
import { CSVLoader } from 'api/csv';
import { uploadMiddleware } from 'api/files';

import { tenants } from 'api/tenants';
import { CreateThesaurusUseCaseFactory } from 'api/core/infrastructure/factories/CreateThesaurusUseCaseFactory';
import { MongoThesaurusMapper } from 'api/core/infrastructure/mongodb/thesauri/MongoThesaurusMapper';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
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
      if (tenants.current()?.featureFlags?.v2CreateThesaurus && !req.file) {
        const logger = LoggerFactory.default();
        try {
          const startTime = Date.now();

          const useCase = CreateThesaurusUseCaseFactory.default();
          const output = await useCase.execute(req.body);

          logger.info('Create Thesaurus executed successfully', {
            namespace: 'Create_Thesaurus',
            success: true,

            valuesCount: req?.body?.values?.length || 0,
            durationMs: Date.now() - startTime,
          });

          const response = MongoThesaurusMapper.toDBO(output);

          res.json(response);
          req.sockets.emitToCurrentTenant('thesauriChange', response);
          return;
        } catch (error) {
          logger.info(
            `Create Thesaurus execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            {
              namespace: 'Create_Thesaurus',
              success: false,

              dto: JSON.stringify(req?.body || {}),
              error: JSON.stringify(error),
            }
          );

          throw error;
        }
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
