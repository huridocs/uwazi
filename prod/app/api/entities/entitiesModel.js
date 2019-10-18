"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));

var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const entitySchema = new _mongoose.default.Schema({
  language: { type: String, index: true },
  mongoLanguage: { type: String, select: false },
  sharedId: { type: String, index: true },
  title: { type: String, required: true },
  template: { type: _mongoose.default.Schema.Types.ObjectId, ref: 'templates', index: true },
  file: {
    originalname: String,
    filename: String,
    mimetype: String,
    size: Number,
    timestamp: Number,
    language: String },

  fullText: { type: _mongoose.default.Schema.Types.Mixed, select: false },
  totalPages: Number,
  icon: new _mongoose.default.Schema({
    _id: String,
    label: String,
    type: String }),

  toc: [{
    label: String,
    indentation: Number,
    range: {
      start: Number,
      end: Number } }],


  attachments: [{
    originalname: String,
    filename: String,
    mimetype: String,
    timestamp: Number,
    size: Number }],

  creationDate: Number,
  processed: Boolean,
  uploaded: Boolean,
  published: Boolean,
  metadata: _mongoose.default.Schema.Types.Mixed,
  pdfInfo: _mongoose.default.Schema.Types.Mixed,
  user: { type: _mongoose.default.Schema.Types.ObjectId, ref: 'users' } },
{ emitIndexErrors: true });

entitySchema.index({ title: 'text' }, { language_override: 'mongoLanguage' });

const Model = (0, _odm.default)('entities', entitySchema);
Model.db.collection.dropIndex('title_text', () => {Model.db.ensureIndexes();});
const { save } = Model;
const suportedLanguages = ['da', 'nl', 'en', 'fi', 'fr', 'de', 'hu', 'it', 'nb', 'pt', 'ro', 'ru', 'es', 'sv', 'tr'];

const setMongoLanguage = doc => {
  if (!doc.language) {
    return doc;
  }

  let mongoLanguage = doc.language;
  if (!suportedLanguages.includes(mongoLanguage)) {
    mongoLanguage = 'none';
  }

  return Object.assign({}, doc, { mongoLanguage });
};

Model.save = data => {
  if (Array.isArray(data)) {
    return save(data.map(setMongoLanguage));
  }

  return save(setMongoLanguage(data));
};var _default =

Model;exports.default = _default;