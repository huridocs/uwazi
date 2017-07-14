import search from './search';
import needsAuthorization from '../auth/authMiddleware';
export default (app) => {
  app.get('/api/search/count_by_template', (req, res) => {
    return search.countByTemplate(req.query.templateId)
    .then(results => res.json(results))
    .catch(res.error);
  });

  /**
  * @swagger
  * /search:
  *   get:
  *     tags:
  *       - search
  *     description: Returns a list of entities matching the filters
  *     parameters:
  *       - name: searchTerm
  *         description: A string to search for inside documents and titles
  *         in:  query
  *         required: false
  *         type: string
  *       - name: types
  *         description: An url encoded array of type _ids
  *         in:  query
  *         required: false
  *         type: string
  *         example: '["_id1", "_id2"]'
  *       - name: order
  *         in:  query
  *         required: false
  *         type: string
  *         enum: ['asc', 'desc']
  *       - name: sort
  *         description: A property to sort results by
  *         in:  query
  *         required: false
  *         type: string
  *         example: creationDate
  *       - name: filters
  *         description: An url encoded object with properties to filter by and the values of the filter
  *         in:  query
  *         required: false
  *         type: string
  *         example: '{"multi_select_property_name":["value_selected", "value_selected"]}'
  *     responses:
  *       200:
  *         description: Returns an object with the result
  *         schema:
  *           type: object
  *           properties:
  *             rows:
  *               type: array
  *               items:
  *                 $ref: '#/definitions/Entity'
  *             aggregations:
  *               type: object
  *               description: An object that contains the amount of matches for the different possible filters for the actual selected filters.
  *             totalRows:
  *               type: integer
  */
  app.get('/api/search', (req, res) => {
    if (req.query.filters) {
      req.query.filters = JSON.parse(req.query.filters);
    }
    if (req.query.types) {
      req.query.types = JSON.parse(req.query.types);
    }
    if (req.query.fields) {
      req.query.fields = JSON.parse(req.query.fields);
    }
    if (req.query.aggregations) {
      req.query.aggregations = JSON.parse(req.query.aggregations);
    }

    return search.search(req.query, req.language, req.user)
    .then(results => res.json(results))
    .catch(res.error);
  });

  app.get('/api/search_snippets', (req, res) => {
    return search.searchSnippets(req.query.searchTerm, req.query.id, req.language)
    .then(results => res.json(results))
    .catch(res.error);
  });

  app.get('/api/search/match_title', (req, res) => {
    return search.matchTitle(req.query.searchTerm, req.language)
    .then(results => res.json(results))
    .catch(res.error);
  });

  app.get('/api/search/unpublished', needsAuthorization(['admin', 'editor']), (req, res) => {
    search.getUploadsByUser(req.user, req.language)
    .then(response => res.json({rows: response}))
    .catch(res.error);
  });
};
