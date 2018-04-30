import mongoose from 'mongoose';

import instanceModel from 'api/odm';

const entitySchema = new mongoose.Schema({
  language: { type: String, index: true },
  mongoLanguage: { type: String, select: false },
  sharedId: { type: String, index: true },
  type: String,
  title: String,
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'templates', index: true },
  file: {
    originalname: String,
    filename: String,
    mimetype: String,
    size: Number,
    language: String
  },
  fullText: { type: mongoose.Schema.Types.Mixed, select: false },
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
  processed: Boolean,
  uploaded: Boolean,
  published: Boolean,
  metadata: mongoose.Schema.Types.Mixed,
  pdfInfo: mongoose.Schema.Types.Mixed,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
}, { emitIndexErrors: true });

entitySchema.index({ title: 'text' }, { language_override: 'mongoLanguage' });

const schema = mongoose.model('entities', entitySchema);
const Model = instanceModel(schema);

const { save } = Model;
const unsuportedLanguages = ['ar'];

const setMongoLanguage = (doc) => {
  if (!doc.language) {
    return doc;
  }

  let mongoLanguage = doc.language;
  if (unsuportedLanguages.includes(doc.language)) {
    mongoLanguage = 'none';
  }

  return Object.assign({}, doc, { mongoLanguage });
};

Model.save = (data) => {
  if (Array.isArray(data)) {
    return save(data.map(setMongoLanguage));
  }

  return save(setMongoLanguage(data));
};

export default Model;
