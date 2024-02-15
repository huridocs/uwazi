import relationtypes from 'api/relationtypes/relationtypes';
import { ObjectIdAsString } from 'api/utils/ajvSchemas';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post(
    '/api/relationtypes',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            _id: ObjectIdAsString,
            __v: { type: 'number' },
            name: { type: 'string' },
            properties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  __v: { type: 'number' },
                  localID: { type: 'string' },
                  id: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                  content: { type: 'string' },
                  name: { type: 'string' },
                  filter: { type: 'boolean' },
                  sortable: { type: 'boolean' },
                  showInCard: { type: 'boolean' },
                  prioritySorting: { type: 'boolean' },
                  nestedProperties: { type: 'array' },
                },
              },
            },
          },
        },
      },
      required: ['body'],
    }),
    (req, res, next) => {
      relationtypes
        .save(req.body)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get(
    '/api/relationtypes',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            _id: ObjectIdAsString,
          },
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      if (req.query._id) {
        return relationtypes
          .getById(req.query._id)
          .then(response => res.json({ rows: [response] }))
          .catch(next);
      }
      relationtypes
        .get()
        .then(response => res.json({ rows: response }))
        .catch(next);
    }
  );

  app.delete(
    '/api/relationtypes',
    needsAuthorization(),
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
      relationtypes
        .delete(req.query._id)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
