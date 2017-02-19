import path from 'path';
import sanitize from 'sanitize-filename';
import documents from './documents';
import templates from '../templates';
import needsAuthorization from '../auth/authMiddleware';
import {uploadDocumentsPath} from '../config/paths';

export default (app) => {
  app.post('/api/documents', needsAuthorization, (req, res) => {
    return documents.save(req.body, {user: req.user, language: req.language})
    .then(doc => res.json(doc))
    .catch((error) => res.json({error}, 500));
  });

  app.post('/api/documents/pdfInfo', (req, res) => {
    return documents.savePDFInfo(req.body, {language: req.language})
    .then(doc => res.json(doc))
    .catch((error) => res.json({error}, 500));
  });

  app.get('/api/documents/html', (req, res) => {
    return documents.getHTML(req.query._id, req.language)
    .then(doc => res.json(doc))
    .catch((error) => res.json({error}, 500));
  });

  app.get('/api/documents/count_by_template', (req, res) => {
    return templates.countByTemplate(req.query.templateId)
    .then(results => res.json(results))
    .catch((error) => res.json({error}, 500));
  });

  app.get('/api/documents', (req, res) => {
    let id;

    if (req.query && req.query._id) {
      id = req.query._id;
    }

    documents.get(id, req.language).then(response => {
      res.json(response);
    })
    .catch((error) => res.json({error}, 500));
  });

  app.delete('/api/documents', needsAuthorization, (req, res) => {
    documents.delete(req.query.sharedId)
    .then((response) => res.json(response))
    .catch((error) => res.json({error}, 500));
  });

  app.get('/api/documents/download', (req, res) => {
    documents.getById(req.query._id)
    .then((response) => {
      res.download(uploadDocumentsPath + response.file.filename, sanitize(response.title + path.extname(response.file.filename)));
    })
    .catch((error) => res.json({error}, 500));
  });
};
