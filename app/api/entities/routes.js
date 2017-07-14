import entities from './entities';
import templates from '../templates/templates';
import thesauris from '../thesauris/thesauris';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  /**
  * @swagger
  * /entities:
  *   post:
  *     tags:
  *       - entities
  *     description: Creates an entity
  *     parameters:
  *       - name: _id
  *         description: sharedId of the entity
  *         in:  body
  *         required: true
  *         schema:
  *           $ref: '#/definitions/Entity'
  *     responses:
  *       200:
  *         description: The entity created
  *         schema:
  *           $ref: '#/definitions/Entity'
  *       401:
  *          description: Unauthorized
  *          schema:
  *           $ref: '#/definitions/Error'
  */
  app.post('/api/entities', needsAuthorization(['admin', 'editor']), (req, res) => {
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
    .catch(res.error);
  });

  app.post('/api/entities/multipleupdate', needsAuthorization(['admin', 'editor']), (req, res) => {
    return entities.multipleUpdate(req.body.ids, req.body.values, {user: req.user, language: req.language})
    .then(docs => {
      res.json(docs.map((doc) => doc.sharedId));
    })
    .catch(res.error);
  });

  /**
  * @swagger
  * /entities/count_by_template:
  *   get:
  *     tags:
  *       - entities
  *     description: Returns the number of entities using the template
  *     parameters:
  *       - name: templateId
  *         description: _id of the template
  *         in:  query
  *         required: true
  *         type: string
  *     responses:
  *       200:
  *         description: The number of entities using the template in all the languages
  *         schema:
  *           type: integer
  */
  app.get('/api/entities/count_by_template', (req, res) => {
    return entities.countByTemplate(req.query.templateId)
    .then(response => res.json(response))
    .catch(res.error);
  });

  /**
  * @swagger
  * /entities/uploads:
  *   get:
  *     deprecated: true
  *     tags:
  *       - entities
  *     description: Returns the entities uploaded by the current user
  *     responses:
  *       200:
  *         description: An array with entities
  *         schema:
  *           type: object
  *           properties:
  *             rows:
  *               type: array
  *               items:
  *                 $ref: '#/definitions/Entity'
  */
  app.get('/api/entities/uploads', needsAuthorization(['admin', 'editor']), (req, res) => {
    entities.getUploadsByUser(req.user)
    .then(response => res.json(response))
    .catch(res.error);
  });

  /**
  * @swagger
  * /entities:
  *   get:
  *     tags:
  *       - entities
  *     description: Returns an entity
  *     parameters:
  *       - name: _id
  *         description: sharedId of the entity
  *         in:  query
  *         required: true
  *         type: string
  *     responses:
  *       200:
  *         description: An object with rows containning the document
  *         schema:
  *           type: object
  *           properties:
  *             rows:
  *               type: array
  *               items:
  *                 $ref: '#/definitions/Entity'
  *       404:
  *          description: Not found
  *          schema:
  *           type: object
  */
  app.get('/api/entities', (req, res) => {
    entities.getById(req.query._id, req.language)
    .then((response) => {
      if (!response) {
        res.json({}, 404);
        return;
      }
      res.json({rows: [response]});
    })
    .catch(res.error);
  });

  /**
  * @swagger
  * /entities:
  *   delete:
  *     tags:
  *       - entities
  *     description: Deletes an entity
  *     parameters:
  *       - name: sharedId
  *         description: sharedId of the entity
  *         in:  query
  *         required: true
  *         type: string
  *     responses:
  *       200:
  *         description: An array with containning the deleted entities, one for each different language in the instance
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Entity'
  *       500:
  *          description: Server error
  *          schema:
  *           type: object
  */
  app.delete('/api/entities', needsAuthorization(['admin', 'editor']), (req, res) => {
    entities.delete(req.query.sharedId)
    .then(response => res.json(response))
    .catch(res.error);
  });

  /**
  * @swagger
  * /entities/multiple:
  *   delete:
  *     tags:
  *       - entities
  *     description: Deletes multiple entities
  *     parameters:
  *       - name: sharedIds
  *         description: URL encoded array of the sharedId of the entities
  *         in:  query
  *         required: true
  *         type: string
  *         example: '["SHARED_ID_ONE","SHARED_ID_TWO"]'
  *     responses:
  *       200:
  *         description: An array with containning the deleted entities, one for each different language in the instance
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Entity'
  *       500:
  *          description: Server error
  *          schema:
  *           type: object
  */
  app.delete('/api/entities/multiple', needsAuthorization(['admin', 'editor']), (req, res) => {
    entities.deleteMultiple(JSON.parse(req.query.sharedIds))
    .then(response => res.json(response))
    .catch(res.error);
  });
};
