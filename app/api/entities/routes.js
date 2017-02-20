import entities from './entities';
import templates from '../templates/templates';
import thesauris from '../thesauris/thesauris';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/entities', needsAuthorization, (req, res) => {
    return entities.save(req.body, {user: req.user, language: req.language})
    .then(response => {
      res.json(response);
      return templates.getById(response.template);
    })
    .then(template => {
      return thesauris.templateToThesauri(template, req.language);
    })
    .then((templateTransformed) => {
      req.io.sockets.emit('thesauriChange', templateTransformed);
    })
    .catch(error => res.json({error}));
  });

  app.get('/api/entities/count_by_template', (req, res) => {
    return entities.countByTemplate(req.query.templateId)
    .then(response => res.json(response))
    .catch(error => res.json({error}));
  });

  app.get('/api/entities/uploads', needsAuthorization, (req, res) => {
    entities.getUploadsByUser(req.user)
    .then(response => res.json(response))
    .catch(error => res.json({error}));
  });

  app.get('/api/entities', (req, res) => {
    entities.getById(req.query._id, req.language)
    .then(response => res.json({rows: [response]}))
    .catch(error => res.json({error}));
  });

  app.delete('/api/entities', needsAuthorization, (req, res) => {
    entities.delete(req.query.sharedId)
    .then(response => res.json(response))
    .catch(error => res.json({error}));
  });
};
