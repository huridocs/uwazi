import mongoose from 'mongoose';
import instanceModel from 'api/odm';

  /**
  * @swagger
  * definition:
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
  *           properties:
  *             originalname:
  *               type: string
  *             filename:
  *               type: string
  *             mimetype:
  *               type: string
  *             size:
  *               type: integer
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

const entitySchema = new mongoose.Schema({
  language: String,
  sharedId: {type: String, index: true},
  type: String,
  title: String,
  template: {type: mongoose.Schema.Types.ObjectId, ref: 'templates'},
  file: {
    originalname: String,
    filename: String,
    mimetype: String,
    size: Number
  },
  icon: new mongoose.Schema({
    _id: String,
    label: String,
    type: String
  }),
  toc: [{
    label: String,
    indentation: Number,
    range: {
      start: Number,
      end: Number
    }
  }],
  attachments: [{
    originalname: String,
    filename: String,
    mimetype: String,
    size: Number
  }],
  creationDate: Number,
  fullText: {type: mongoose.Schema.Types.Mixed, select: false},
  processed: Boolean,
  uploaded: Boolean,
  published: Boolean,
  metadata: mongoose.Schema.Types.Mixed,
  pdfInfo: mongoose.Schema.Types.Mixed,
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
});

let Model = mongoose.model('entities', entitySchema);
export default instanceModel(Model);
