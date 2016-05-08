import relationtypes from 'api/relationtypes/relationtypes';

export default app => {
  app.post('/api/relationtypes', (req, res) => {
    relationtypes.save(req.body)
    .then((response) => res.json(response));
  });

  app.get('/api/relationtypes', (req, res) => {
    if (req.query._id) {
      relationtypes.getById(req.query._id)
      .then((response) => res.json(response));
      return;
    }

    relationtypes.getAll()
    .then((response) => res.json(response));
  });

  app.delete('/api/relationtypes', (req, res) => {
    relationtypes.delete(req.query)
    .then((response) => res.json(response));
  });
};
