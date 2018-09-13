import entities from './entities';
import templates from '../templates/templates';
import thesauris from '../thesauris/thesauris';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/entities', needsAuthorization(['admin', 'editor']), (req, res, next) => entities.save(req.body, { user: req.user, language: req.language })
  .then((response) => {
    res.json(response);
    return templates.getById(response.template);
  })
  .then(template => thesauris.templateToThesauri(template, req.language, req.user))
  .then((templateTransformed) => {
    req.io.sockets.emit('thesauriChange', templateTransformed);
  })
  .catch(next));

  app.post('/api/entities/multipleupdate', needsAuthorization(['admin', 'editor']),
  (req, res, next) => entities.multipleUpdate(req.body.ids, req.body.values, { user: req.user, language: req.language })
  .then((docs) => {
    res.json(docs.map(doc => doc.sharedId));
  })
  .catch(next));

  app.get('/api/entities/count_by_template', (req, res, next) => entities.countByTemplate(req.query.templateId)
  .then(response => res.json(response))
  .catch(next));

  app.get('/api/entities/get_raw_page', (req, res, next) => entities.getRawPage(req.query.sharedId, req.language, req.query.pageNumber)
  .then(data => res.json({ data }))
  .catch(next));

  app.get('/api/entities', (req, res, next) => {
    entities.getWithRelationships({ sharedId: req.query._id, language: req.language })
    .then((_entities) => {
      if (!_entities.length || (!_entities[0].published && !req.user)) {
        res.status(404);
        res.json({});
        return;
      }
      res.json({ rows: _entities });
    })
    .catch(next);
  });

  app.delete('/api/entities', needsAuthorization(['admin', 'editor']), (req, res, next) => {
    entities.delete(req.query.sharedId)
    .then(response => res.json(response))
    .catch(next);
  });

  app.delete('/api/entities/multiple', needsAuthorization(['admin', 'editor']), (req, res, next) => {
    entities.deleteMultiple(JSON.parse(req.query.sharedIds))
    .then(response => res.json(response))
    .catch(next);
  });
};
