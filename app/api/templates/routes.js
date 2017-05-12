import templates from './templates';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/templates', needsAuthorization(), (req, res) => {
    templates.save(req.body)
    .then((response) => {
      res.json(response);
      req.io.sockets.emit('templateChange', response);
    })
    .catch(res.error);
  });

  app.get('/api/templates', (req, res) => {
    templates.get()
    .then(response => res.json({rows: response}))
    .catch(res.error);
  });

  app.delete('/api/templates', needsAuthorization(), (req, res) => {
    templates.delete(req.query)
    .then((response) => {
      res.json(response);
      req.io.sockets.emit('templateDelete', response);
    })
    .catch(res.error);
  });

  app.get('/api/templates/count_by_thesauri', (req, res) => {
    templates.countByThesauri(req.query._id)
    .then(response => res.json(response))
    .catch(res.error);
  });
};
