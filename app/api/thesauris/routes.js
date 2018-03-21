import needsAuthorization from '../auth/authMiddleware';
import thesauris from './thesauris';

export default app => {
  app.post('/api/thesauris', needsAuthorization(), (req, res) => {
    thesauris.save(req.body)
    .then((response) => {
      res.json(response);
      req.io.sockets.emit('thesauriChange', response);
    })
    .catch((error) => res.json({error}));
  });

  app.get('/api/thesauris', (req, res) => {
    let id;
    if (req.query) {
      id = req.query._id;
    }
    thesauris.get(id, req.language, req.user)
    .then((response) => res.json({rows: response}))
    .catch((error) => res.json({error}));
  });

  app.get('/api/dictionaries', (req, res) => {
    let id;
    if (req.query && req.query._id) {
      id = {_id: req.query._id};
    }
    thesauris.dictionaries(id)
    .then((response) => res.json({rows: response}))
    .catch((error) => res.json({error}));
  });

  app.get('/api/thesauris/entities', (req, res) => {
    thesauris.entities(req.language)
    .then((response) => res.json({rows: response}))
    .catch((error) => res.json({error}));
  });

  app.delete('/api/thesauris', needsAuthorization(), (req, res) => {
    thesauris.delete(req.query._id, req.query._rev)
    .then((response) => {
      res.json(response);
      req.io.sockets.emit('thesauriDelete', response);
    })
    .catch((error) => res.json({error}));
  });
};
