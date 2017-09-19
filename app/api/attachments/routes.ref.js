/**
* @swagger
* definitions:
*   Attachment:
*     properties:
*       _id:
*         type: string
*       filename:
*         type: string
*       originalname:
*         type: string
*       size:
*         type: string
*       mimetype:
*         type: string
*/


/**
* @swagger
* /attachments/download:
*   get:
*     tags:
*       - attachments
*     description: Returns the attachments for an entity
*     parameters:
*       - name: _id
*         description: _id of the entity who owns the attachment
*         in:  query
*         required: true
*         type: string
*       - name: file
*         description: file name of the attachment requested
*         in:  query
*         required: true
*         type: string
*     responses:
*       200:
*         description: The original file
*         schema:
*           type: file
*       500:
*          description: Server error
*          schema:
*           $ref: '#/definitions/Error'
*/

/**
* @swagger
* /attachments/upload:
*   post:
*     tags:
*       - attachments
*     description: Uploads a new attachment for the entity
*     parameters:
*       - name: entityId
*         description: _id of the entity
*         in:  formData
*         required: true
*         type: string
*       - name: allLanguages
*         description: Flag to add the attachments in all languages or not
*         in:  formData
*         required: false
*         type: boolean
*       - name: attachment
*         description: The attachment
*         in:  formData
*         required: true
*         type: file
*     responses:
*       200:
*         description: The new attachment object
*         schema:
*           $ref: '#/definitions/Attachment'
*       500:
*          description: Server error
*          schema:
*           $ref: '#/definitions/Error'
*/

/**
* @swagger
* /attachments/rename:
*   post:
*     tags:
*       - attachments
*     description: Uploads a new attachment for the entity
*     parameters:
*       - name: body
*         in:  body
*         schema:
*           type: object
*           properties:
*             entityId:
*               type: string
*             _id:
*               type: string
*             originalname:
*               type: string
*     responses:
*       200:
*         description: The new attachment object
*         schema:
*           $ref: '#/definitions/Attachment'
*       500:
*          description: Server error
*          schema:
*           $ref: '#/definitions/Error'
*/


/**
* @swagger
* /attachments/delete:
*   delete:
*     tags:
*       - attachments
*     description: Deletes the attachments of an entity
*     parameters:
*       - name: entityId
*         description: _id of the attachment requested
*         in:  query
*         required: true
*         type: string
*       - name: filename
*         description: file name of the attachment
*         in:  query
*         required: true
*         type: string
*     responses:
*       200:
*         description: The entity owner of the deleted attachment
*         schema:
*           $ref: '#/definitions/Entity'
*       500:
*          description: Server error
*          schema:
*           $ref: '#/definitions/Error'
*/
