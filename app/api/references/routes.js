import references from './references.js';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/references', needsAuthorization, (req, res) => {
    references.save(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.delete('/api/references', needsAuthorization, (req, res) => {
    references.delete(req.query)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.get('/api/references', (req, res) => {
    if (req.query && req.query.sourceDocument) {
      references.getByDocument(req.query.sourceDocument)
      .then((response) => {
        res.json(response);
      })
      .catch((error) => {
        res.json({error: error.json});
      });
      return;
    }

    references.getAll()
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.get('/api/references/count_by_relationtype', (req, res) => {
    references.countByRelationType(req.query.relationtypeId)
    .then((response) => {
      res.json(response);
    });
  });
};
