import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { MetadataObjectSchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';

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
    published: Boolean,
    icon: new mongoose.Schema({
      _id: String,
      label: String,
      type: String,
    }),
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
    metadata: mongoose.Schema.Types.Mixed,
    suggestedMetadata: mongoose.Schema.Types.Mixed,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  },
  { emitIndexErrors: true }
);

mongoSchema.index({ title: 'text' }, { language_override: 'mongoLanguage' });

const Model = instanceModel<EntitySchema>('entities', mongoSchema);

const supportedLanguages = [
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
  if (!supportedLanguages.includes(mongoLanguage)) {
    mongoLanguage = 'none';
  }

  return Object.assign({}, doc, { mongoLanguage });
};

const modelSaveRaw = Model.save.bind(Model);
Model.save = async doc => modelSaveRaw(setMongoLanguage(doc));

export default Model;
