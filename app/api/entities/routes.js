import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import entities from './entities';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/entities', needsAuthorization, (req, res) => {
    return entities.save(req.body, {user: req.user, language: req.language})
    .then(doc => res.json(doc));
  });

  app.get('/api/entities/count_by_template', (req, res) => {
    return entities.countByTemplate(req.query.templateId)
    .then(results => res.json(results));
  });

  app.get('/api/entities/uploads', needsAuthorization, (req, res) => {
    entities.getUploadsByUser(req.user)
    .then(response => res.json(response))
    .catch(error => res.json({error: error}));
  });

  app.get('/api/entities', (req, res) => {
    entities.get(req.query.sharedId, req.language)
    .then(response => res.json(response))
    .catch(error => res.json({error: error}));
  });

  app.delete('/api/entities', needsAuthorization, (req, res) => {
    entities.delete(req.query._id)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
