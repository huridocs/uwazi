import {
  createDefaultValidator,
  getValidatorMiddleware,
} from 'api/common.v2/validation/ajvInstances';
import needsAuthorization from '../auth/authMiddleware';

const RelationshipInput = {
  type: 'object',
  additionalProperties: false,
  properties: {
    from: { type: 'string' },
    to: { type: 'string' },
    type: { type: 'string' },
  },
  required: ['from', 'to', 'type'],
};

const RelationshipInputArray = {
  type: 'array',
  items: RelationshipInput,
};
const validateRelationshipInputArray = createDefaultValidator(RelationshipInputArray);

export default app => {
  //   app.post(
  //     '/api/relationships.v2/bulk',
  //     needsAuthorization(['admin', 'editor', 'collaborator']),
  //     async (req, res, next) => {
  //       // the option to do saves and deletes in one endpoint
  //       res.status(418);
  //       res.json({ error: 'not implemented yet' });
  //     }
  //   );

  app.post(
    '/api/relationships.v2',
    // needsAuthorization(['admin', 'editor']),
    getValidatorMiddleware(validateRelationshipInputArray),
    (req, res, next) => {
      // save relationships (based on post api/references)
      res.status(418);
      res.json({ error: 'not implemented yet' });
    }
  );

//   app.delete(
//     '/api/relationships.v2',
//     needsAuthorization(['admin', 'editor']),
//     // validation.validateRequest(
//     //   Joi.object()
//     //     .keys({
//     //       _id: Joi.objectId().required(),
//     //     })
//     //     .required(),
//     //   'query'
//     // ),
//     (req, res, next) => {
//       // delete relationships
//       res.status(418);
//       res.json({ error: 'not implemented yet' });
//     }
//   );

  //   app.get(
  //     '/api/relationships.v2/by_entity/',
  //     // validation.validateRequest(
  //     //   Joi.object()
  //     //     .keys({
  //     //       sharedId: Joi.string().required(),
  //     //       file: Joi.string(),
  //     //       onlyTextReferences: Joi.string(),
  //     //     })
  //     //     .required(),
  //     //   'query'
  //     // ),
  //     (req, res, next) => {
  //       // get references for an entity, based on get /api/references/by_document/
  //       res.status(418);
  //       res.json({ error: 'not implemented yet' });
  //     }
  //   );

  //   // how does this group?
  //   // app.get('/api/references/group_by_connection/', (req, res, next) => {
  //   //   relationships
  //   //     .getGroupsByConnection(req.query.sharedId, req.language, {
  //   //       excludeRefs: true,
  //   //       user: req.user,
  //   //     })
  //   //     .then(response => {
  //   //       res.json(response);
  //   //     })
  //   //     .catch(next);
  //   // });

  //   // what does this do?
  //   // app.get(
  //   //   '/api/references/search/',
  //   //   validation.validateRequest(
  //   //     Joi.object().keys({
  //   //       sharedId: Joi.string().allow(''),
  //   //       filter: Joi.string().allow(''),
  //   //       limit: Joi.string().allow(''),
  //   //       sort: Joi.string().allow(''),
  //   //       order: Joi.string(),
  //   //       treatAs: Joi.string(),
  //   //       searchTerm: Joi.string().allow(''),
  //   //     }),
  //   //     'query'
  //   //   ),
  //   //   (req, res, next) => {
  //   //     req.query.filter = JSON.parse(req.query.filter || '{}');
  //   //     const { sharedId, ...query } = req.query;
  //   //     relationships
  //   //       .search(req.query.sharedId, query, req.language, req.user)
  //   //       .then(results => res.json(results))
  //   //       .catch(next);
  //   //   }
  //   // );

  //   app.get(
  //     '/api/relationships.v2/count_by_relationtype',
  //     // validation.validateRequest(
  //     //   Joi.object()
  //     //     .keys({
  //     //       relationtypeId: Joi.objectId().required(),
  //     //     })
  //     //     .required(),
  //     //   'query'
  //     // ),
  //     (req, res, next) => {
  //       // a count aggregation on relationtype
  //       res.status(418);
  //       res.json({ error: 'not implemented yet' });
  //     }
  //   );
};
