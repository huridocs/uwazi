import mongoose from 'mongoose';

import instanceModel from 'api/odm';

const entitySchema = new mongoose.Schema({
  language: { type: String, index: true },
  mongoLanguage: { type: String, select: false },
  sharedId: { type: String, index: true },
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
  totalPages: Number,
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
schema.collection.dropIndex('title_text', () => { schema.ensureIndexes(); });
const Model = instanceModel(schema);
const { save } = Model;
const suportedLanguages = ['da', 'nl', 'en', 'fi', 'fr', 'de', 'hu', 'it', 'nb', 'pt', 'ro', 'ru', 'es', 'sv', 'tr'];

const setMongoLanguage = (doc) => {
  if (!doc.language) {
    return doc;
  }

  let mongoLanguage = doc.language;
  if (!suportedLanguages.includes(mongoLanguage)) {
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
