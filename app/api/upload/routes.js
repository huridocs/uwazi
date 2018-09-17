import Joi from 'joi';
import multer from 'multer';

import ID from 'shared/uniqueID';
import debugLog from 'api/log/debugLog';
import entities from 'api/entities';
import errorLog from 'api/log/errorLog';
import fs from 'fs';
import languages from 'shared/languages';
import path from 'path';
import relationships from 'api/relationships';

import { uploadDocumentsPath } from '../config/paths';
import { validateRequest } from '../utils';
import PDF from './PDF';
import needsAuthorization from '../auth/authMiddleware';
import uploads from './uploads';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.normalize(`${uploadDocumentsPath}/`));
  },
  filename(req, file, cb) {
    cb(null, Date.now() + ID() + path.extname(file.originalname));
  }
});

export default (app) => {
  const upload = multer({ storage });

  const getDocuments = (id, allLanguages) => {
    if (allLanguages) {
      return entities.getAllLanguages(id);
    }

    return entities.getById(id).then(doc => [doc]);
  };

  const uploadProcess = (req, res, allLanguages = true) => getDocuments(req.body.document, allLanguages)
  .then((docs) => {
    debugLog.debug(`Upload Process for ${docs[0]._id.toString()}`);
    debugLog.debug(`Original name ${fs.existsSync(req.files[0].originalname)}`);
    debugLog.debug(`File exists ${fs.existsSync(req.files[0].path)}`);

    return entities.saveMultiple(docs.map(doc => ({ ...doc, file: req.files[0], uploaded: true })));
  })
  .then(() => {
    debugLog.debug(`Documents saved as uploaded for: ${req.files[0].originalname}`);
    res.json(req.files[0]);

    const file = req.files[0].destination + req.files[0].filename;

    const sessionSockets = req.io.getCurrentSessionSockets();
    sessionSockets.emit('conversionStart', req.body.document);
    debugLog.debug(`Starting conversion of: ${req.files[0].originalname}`);
    return Promise.all([
        new PDF(file, req.files[0].originalname).convert(),
        getDocuments(req.body.document, allLanguages)
    ]);
  })
  .then(([conversion, _docs]) => {
    debugLog.debug(`Conversion succeeed for: ${req.files[0].originalname}`);

    const docs = _docs.map(doc => ({
        ...doc,
        processed: true,
        fullText: conversion.fullText,
        totalPages: conversion.totalPages,
        formattedPlainTextPages: conversion.formatted,
        file: { ...doc.file, language: languages.detect(Object.values(conversion.fullText).join(''), 'franc') },
        toc: [],
    }));

    debugLog.debug('Saving documents');
    return entities.saveMultiple(docs).then(() => {
      const sessionSockets = req.io.getCurrentSessionSockets();
      sessionSockets.emit('documentProcessed', req.body.document);
    });
  })
  .catch((err) => {
    errorLog.error(err.error);
    debugLog.debug(err.error);

    getDocuments(req.body.document, allLanguages)
    .then((docs) => {
      entities.saveMultiple(docs.map(doc => ({ ...doc, processed: false })));
    });

    const sessionSockets = req.io.getCurrentSessionSockets();
    sessionSockets.emit('conversionFailed', req.body.document);
  });

  app.post('/api/upload', needsAuthorization(['admin', 'editor']), upload.any(), (req, res) => uploadProcess(req, res));

  app.post('/api/customisation/upload', needsAuthorization(['admin', 'editor']), upload.any(), (req, res, next) => {
    uploads.save(req.files[0])
    .then((saved) => {
      res.json(saved);
    })
    .catch(next);
  });

  app.get('/api/customisation/upload', needsAuthorization(['admin', 'editor']), (req, res, next) => {
    uploads.get()
    .then((result) => {
      res.json(result);
    })
    .catch(next);
  });

  app.delete(
    '/api/customisation/upload',

    needsAuthorization(['admin', 'editor']),

    validateRequest(Joi.object({
      _id: Joi.string().required()
    }).required(), 'query'),

    (req, res, next) => {
      uploads.delete(req.query._id)
      .then((result) => {
        res.json(result);
      })
      .catch(next);
    }
  );

  app.post(
    '/api/reupload',

    needsAuthorization(['admin', 'editor']),

    upload.any(),

    (req, res, next) => entities.getById(req.body.document)
    .then(doc => Promise.all([doc, relationships.deleteTextReferences(doc.sharedId, doc.language)]))
    .then(([doc]) => entities.saveMultiple([{ _id: doc._id, toc: [] }]))
    .then(() => uploadProcess(req, res, false))
    .catch(next)
  );
};
