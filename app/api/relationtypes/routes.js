import relationtypes from 'api/relationtypes/relationtypes';

export default app => {
  app.post('/api/relationtypes', (req, res) => {
    relationtypes.save(req.body)
    .then(res.json);
  });

  app.get('/api/relationtypes', (req, res) => {
    if (req.query._id) {
      relationtypes.getById(req.query._id)
      .then(res.json);
      return;
    }

    relationtypes.getAll()
    .then(res.json);
  });

  app.delete('/api/relationtypes', (req, res) => {
    relationtypes.delete(req.query._id)
    .then(res.json);
  });
};
