import templates from './templates';
import settings from 'api/settings';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.post('/api/templates', needsAuthorization(), (req, res) => {
    templates.save(req.body, req.language)
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
    let template = {_id: req.query._id};
    templates.delete(template)
    .then(() => {
      return settings.removeTemplateFromFilters(template._id);
    })
    .then((newSettings) => {
      res.json(template);
      req.io.sockets.emit('updateSettings', newSettings);
      req.io.sockets.emit('templateDelete', template);
    })
    .catch(res.error);
  });

  app.get('/api/templates/count_by_thesauri', (req, res) => {
    templates.countByThesauri(req.query._id)
    .then(response => res.json(response))
    .catch(res.error);
  });
};
