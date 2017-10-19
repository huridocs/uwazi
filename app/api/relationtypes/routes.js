import relationtypes from 'api/relationtypes/relationtypes';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/relationtypes', needsAuthorization(), (req, res) => {
    relationtypes.save(req.body)
    .then((response) => res.json(response));
  });

  app.get('/api/relationtypes', (req, res) => {
    if (req.query._id) {
      return relationtypes.getById(req.query._id)
      .then(response => res.json({rows: [response]}));
    }

    relationtypes.get()
    .then(response => {
      console.log(response);
      res.json({rows: response})
    });
  });

  app.delete('/api/relationtypes', needsAuthorization(), (req, res) => {
    relationtypes.delete(req.query._id)
    .then(response => res.json(response));
  });
};
