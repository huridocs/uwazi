/**
* @swagger
* /attachments/download:
*   get:
*     tags:
*       - attachments
*     description: Returns the attachments for a document
*     parameters:
*       - name: _id
*         description: _id of the attachment requested
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
