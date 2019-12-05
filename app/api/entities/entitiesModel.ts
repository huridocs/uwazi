/** @format */

import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { MetadataObjectSchema, PropertyValueSchema } from 'shared/commonTypes';
import { EntitySchema } from './entityType';

export interface MetadataObject<T extends PropertyValueSchema> extends MetadataObjectSchema {
  value: T | null;
}

const mongoSchema = new mongoose.Schema(
  {
    language: { type: String, index: true },
    mongoLanguage: { type: String, select: false },
    sharedId: { type: String, index: true },
    title: { type: String, required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'templates', index: true },
    file: {
      originalname: String,
      filename: String,
      mimetype: String,
      size: Number,
      timestamp: Number,
      language: String,
    },
    fullText: { type: mongoose.Schema.Types.Mixed, select: false },
    totalPages: Number,
    icon: new mongoose.Schema({
      _id: String,
      label: String,
      type: String,
    }),
    toc: [
      {
        label: String,
        indentation: Number,
        range: {
          start: Number,
          end: Number,
        },
      },
    ],
    attachments: [
      {
        originalname: String,
        filename: String,
        mimetype: String,
        timestamp: Number,
        size: Number,
      },
    ],
    creationDate: Number,
    processed: Boolean,
    uploaded: Boolean,
    published: Boolean,
    metadata: mongoose.Schema.Types.Mixed,
    pdfInfo: mongoose.Schema.Types.Mixed,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    reviewed: {
      user: String,
      date: Number,
    },
    reviewLog: mongoose.Schema.Types.Mixed,
  },
  { emitIndexErrors: true }
);

mongoSchema.index({ title: 'text' }, { language_override: 'mongoLanguage' });

const Model = instanceModel<EntitySchema>('entities', mongoSchema);
Model.db.collection.dropIndex('title_text', () => {
  // We deliberately kick this promise into the void and ignore the result,
  // because it's usually fast and we can't await here...
  Model.db.ensureIndexes().then(() => {}, () => {});
});

const suportedLanguages = [
  'da',
  'nl',
  'en',
  'fi',
  'fr',
  'de',
  'hu',
  'it',
  'nb',
  'pt',
  'ro',
  'ru',
  'es',
  'sv',
  'tr',
];

const setMongoLanguage = (doc: EntitySchema) => {
  if (!doc.language) {
    return doc;
  }

  let mongoLanguage = doc.language;
  if (!suportedLanguages.includes(mongoLanguage)) {
    mongoLanguage = 'none';
  }

  return Object.assign({}, doc, { mongoLanguage });
};

const modelSaveRaw = Model.save.bind(Model);
Model.save = async doc => modelSaveRaw(setMongoLanguage(doc));

export default Model;
