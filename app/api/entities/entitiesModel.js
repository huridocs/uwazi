import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const entitySchema = new mongoose.Schema({
  language: String,
  sharedId: String,
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
  fullText: {type: String, select: false},
  processed: Boolean,
  uploaded: Boolean,
  published: Boolean,
  metadata: mongoose.Schema.Types.Mixed,
  pdfInfo: mongoose.Schema.Types.Mixed,
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
});

let Model = mongoose.model('entities', entitySchema);
export default instanceModel(Model);
