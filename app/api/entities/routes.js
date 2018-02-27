import entities from './entities';
import templates from '../templates/templates';
import thesauris from '../thesauris/thesauris';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/entities', needsAuthorization(['admin', 'editor']), (req, res) => {
    return entities.save(req.body, {user: req.user, language: req.language})
    .then(response => {
      return entities.getWithRelationships({_id: response._id});
    })
    .then(([response]) => {
      res.json(response);
      return templates.getById(response.template);
    })
    .then(template => {
      return thesauris.templateToThesauri(template, req.language);
    })
    .then((templateTransformed) => {
      req.io.sockets.emit('thesauriChange', templateTransformed);
    })
    .catch(res.error);
  });

  app.post('/api/entities/multipleupdate', needsAuthorization(['admin', 'editor']), (req, res) => {
    return entities.multipleUpdate(req.body.ids, req.body.values, {user: req.user, language: req.language})
    .then(docs => {
      res.json(docs.map((doc) => doc.sharedId));
    })
    .catch(res.error);
  });

  app.get('/api/entities/count_by_template', (req, res) => {
    return entities.countByTemplate(req.query.templateId)
    .then(response => res.json(response))
    .catch(res.error);
  });

  app.get('/api/entities/uploads', needsAuthorization(['admin', 'editor']), (req, res) => {
    entities.getUploadsByUser(req.user)
    .then(response => res.json(response))
    .catch(res.error);
  });

  app.get('/api/entities', (req, res) => {
    entities.getWithRelationships({sharedId: req.query._id, language: req.language})
    .then((response) => {
      if (!response) {
        res.json({}, 404);
        return;
      }
      res.json({rows: response});
    })
    .catch(res.error);
  });

  app.delete('/api/entities', needsAuthorization(['admin', 'editor']), (req, res) => {
    entities.delete(req.query.sharedId)
    .then(response => res.json(response))
    .catch(res.error);
  });

  app.delete('/api/entities/multiple', needsAuthorization(['admin', 'editor']), (req, res) => {
    entities.deleteMultiple(JSON.parse(req.query.sharedIds))
    .then(response => res.json(response))
    .catch(res.error);
  });
};
