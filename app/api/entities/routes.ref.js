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
