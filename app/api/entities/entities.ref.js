/**
* @swagger
* definitions:
*   Entity:
*     properties:
*       _id:
*         type: string
*         description: A unique ID for this object in the database.
*       sharedId:
*         type: string
*         description: A shared ID with the other copies of this object for the different languages.
*       language:
*         type: string
*       type:
*         type: string
*       title:
*         type: string
*       template:
*         type: string
*         description: The template _id
*       user:
*         type: string
*         description: The user _id
*       file:
*         description: Only for documents
*         type: object
*         properties:
*           originalname:
*             type: string
*           filename:
*             type: string
*           mimetype:
*             type: string
*           language:
*             type: string
*           size:
*             type: integer
*       icon:
*         type: object
*         properties:
*           _id:
*             type: string
*           label:
*             type: string
*           type:
*             type: string
*       toc:
*         type: array
*         items:
*           type: object
*           properties:
*             label:
*               type: string
*             indentation:
*               type: integer
*             range:
*               type: object
*               properties:
*                 start:
*                   type: integer
*                 end:
*                   type: integer
*       attachments:
*         type: array
*         items:
*           type: object
*           schema:
*             $ref: '#/definitions/Attachment'
*       creationDate:
*         type: integer
*       processed:
*         type: boolean
*       uploaded:
*         type: boolean
*       published:
*         type: boolean
*       metadata:
*         type: object
*         description: Changes depending on the template
*       pdfInfo:
*         type: object
*/
