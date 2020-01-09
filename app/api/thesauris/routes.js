/** @format */

import Joi from 'joi';
import multer from 'multer';
import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import thesauris from './thesauris';
import storageConfig from '../upload/storageConfig';
import CSVLoader from '../csv';

const storage = multer.diskStorage(storageConfig);

export default app => {
  const upload = multer({ storage });

  app.post(
    '/api/thesauris',
    needsAuthorization(),

    upload.any(),

    validation.validateRequest(
      Joi.alternatives(
        Joi.object()
          .keys({
            _id: Joi.string(),
            __v: Joi.number(),
            name: Joi.string().required(),
            enable_classification: Joi.boolean(),
            values: Joi.array()
              .items(
                Joi.object().keys({
                  id: Joi.string(),
                  label: Joi.string().required(),
                  _id: Joi.string(),
                  values: Joi.array(),
                })
              )
              .required(),
          })
          .required(),
        Joi.object()
          .keys({
            thesauri: Joi.string().required(),
          })
          .required()
      ).required()
    ),

    async (req, res, next) => {
      try {
        const data = req.files && req.files.length ? JSON.parse(req.body.thesauri) : req.body;
        let response = await thesauris.save(data);
        if (req.files && req.files.length) {
          const file = req.files[0];
          const loader = new CSVLoader();
          response = await loader.loadThesauri(file.path, response._id, { language: req.language });
        }
        res.json(response);
        req.io.sockets.emit('thesauriChange', response);
      } catch (e) {
        next(e);
      }
    }
  );

  app.get(
    '/api/thesauris',
    validation.validateRequest(
      Joi.object().keys({
        _id: Joi.string(),
      }),
      'query'
    ),
    (req, res, next) => {
      let id;
      if (req.query) {
        id = req.query._id;
      }
      thesauris
        .get(id, req.language, req.user)
        .then(response => res.json({ rows: response }))
        .catch(next);
    }
  );

  app.get(
    '/api/dictionaries',
    validation.validateRequest(
      Joi.object().keys({
        _id: Joi.string(),
      }),
      'query'
    ),
    (req, res, next) => {
      let id;
      if (req.query && req.query._id) {
        id = { _id: req.query._id };
      }
      thesauris
        .dictionaries(id)
        .then(response => res.json({ rows: response }))
        .catch(next);
    }
  );

  app.delete(
    '/api/thesauris',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.string().required(),
          _rev: Joi.any(),
        })
        .required(),
      'query'
    ),
    (req, res, next) => {
      thesauris
        .delete(req.query._id, req.query._rev)
        .then(response => {
          res.json(response);
          req.io.sockets.emit('thesauriDelete', response);
        })
        .catch(next);
    }
  );
};
