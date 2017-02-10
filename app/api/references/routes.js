import references from './references.js';
import search from '../search/search';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/references', needsAuthorization, (req, res) => {
    references.save(req.body, req.language)
    .then(response => res.json(response))
    .catch(error => res.json({error}));
  });

  app.delete('/api/references', needsAuthorization, (req, res) => {
    references.delete(req.query._id)
    .then(response => res.json(response))
    .catch(error => res.json({error: error.json}));
  });

  app.get('/api/references/by_document/:id', (req, res) => {
    references.getByDocument(req.params.id, req.language)
    .then((response) => res.json(response))
    .catch((error) => res.status(500).json({error: error.json}));
  });

  app.get('/api/references/group_by_connection/:id', (req, res) => {
    references.getGroupsByConnection(req.params.id, req.language, {excludeRefs: true, user: req.user})
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.status(500).json({error: error.json});
    });
  });

  // TEST!!!
  app.get('/api/references/search/:id', (req, res) => {
    references.getGroupsByConnection(req.params.id, req.language, {excludeRefs: false, user: req.user})
    .then(groups => {
      const entityIds = groups.reduce((ids, group) => {
        return group.templates.reduce((refs, t) => refs.concat(t.refs.map(r => r.connectedDocument)), ids);
      }, []);


      req.query.ids = entityIds;
      req.query.includeUnpublished = true;
      // req.query.order = 'desc';
      // req.query.sort = 'creationDate';

      search.search(req.query, req.language)
      .then(results => res.json(results));
    })
    .catch((error) => {
      res.status(500).json({error: error.json});
    });
  });
  // ---

  app.get('/api/references/count_by_relationtype', (req, res) => {
    references.countByRelationType(req.query.relationtypeId)
    .then((response) => res.json(response));
  });
};
