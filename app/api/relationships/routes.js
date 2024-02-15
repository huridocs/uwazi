import Ajv from 'ajv';

import { ObjectIdAsString } from 'api/utils/ajvSchemas';
import { LanguageISO6391Schema } from 'shared/types/commonSchemas';
import relationships from './relationships.js';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post(
    '/api/relationships/bulk',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    async (req, res, next) => {
      try {
        const response = await relationships.bulk(req.body, req.language);
        res.json(response);
      } catch (e) {
        if (
          e instanceof Ajv.ValidationError &&
          e.errors.find(
            error => error.instancePath.match(/selectionRectangles/) && error.keyword === 'minItems'
          )
        ) {
          next(new Error('selectionRectangles should not be empty'));
        } else {
          next(e);
        }
      }
    }
  );

  app.post(
    '/api/references',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            _id: ObjectIdAsString,
            __v: { type: 'number' },
            entity: { type: 'string' },
            hub: { type: 'string' },
            template: { type: 'string' },
            metadata: {},
            language: LanguageISO6391Schema,
            range: {
              type: 'object',
              properties: {
                start: { type: 'number' },
                end: { type: 'number' },
                text: { type: 'string' },
              },
            },
          },
        },
      },
      required: ['body'],
    }),
    (req, res, next) => {
      relationships
        .save(req.body, req.language)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.delete(
    '/api/references',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            _id: ObjectIdAsString,
          },
          required: ['_id'],
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      relationships
        .delete({ _id: req.query._id }, req.language)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get(
    '/api/references/by_document/',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            sharedId: { type: 'string' },
            file: { type: 'string' },
            onlyTextReferences: { type: 'string' },
          },
          required: ['sharedId'],
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      const unpublished = Boolean(
        req.user && ['admin', 'editor', 'collaborator'].includes(req.user.role)
      );
      const unrestricted = Boolean(req.user && ['admin', 'editor'].includes(req.user.role));

      relationships
        .getByDocument(
          req.query.sharedId,
          req.language,
          unpublished,
          req.query.file,
          req.query.onlyTextReferences,
          unrestricted
        )
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get('/api/references/group_by_connection/', (req, res, next) => {
    relationships
      .getGroupsByConnection(req.query.sharedId, req.language, {
        excludeRefs: true,
        user: req.user,
      })
      .then(response => {
        res.json(response);
      })
      .catch(next);
  });

  app.get(
    '/api/references/search/',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            sharedId: { type: 'string' },
            filter: { type: 'string' },
            limit: { type: 'string' },
            sort: { type: 'string' },
            order: { type: 'string' },
            treatAs: { type: 'string' },
            searchTerm: { type: 'string' },
          },
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      req.query.filter = JSON.parse(req.query.filter || '{}');
      const { sharedId, ...query } = req.query;
      relationships
        .search(req.query.sharedId, query, req.language, req.user)
        .then(results => res.json(results))
        .catch(next);
    }
  );

  app.get(
    '/api/references/count_by_relationtype',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            relationtypeId: ObjectIdAsString,
          },
          required: ['relationtypeId'],
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      relationships
        .countByRelationType(req.query.relationtypeId)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
