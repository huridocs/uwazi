import mongoose from 'mongoose';
import { instanceModelWithPermissions } from 'api/odm/ModelWithPermissions';
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
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'templates' },
    published: Boolean,
    generatedToc: Boolean,
    icon: new mongoose.Schema({
      _id: String,
      label: String,
      type: String,
    }),
    creationDate: Number,
    editDate: Number,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    suggestedMetadata: mongoose.Schema.Types.Mixed,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    permissions: { type: mongoose.Schema.Types.Mixed, select: false },
    obsoleteMetadata: { type: [String] },
  },
  { minimize: false }
);

//mongodb types not updated yet for language_override?
//@ts-ignore
mongoSchema.index({ title: 'text' }, { language_override: 'mongoLanguage' });
mongoSchema.index({ template: 1, language: 1, published: 1 });

const Model = instanceModelWithPermissions<EntitySchema>('entities', mongoSchema);

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

  return { ...doc, mongoLanguage };
};

const modelSaveRaw = Model.save.bind(Model);
Model.save = async doc => modelSaveRaw(setMongoLanguage(doc));

const modelSaveMultipleRaw = Model.saveMultiple.bind(Model);
Model.saveMultiple = async docs => modelSaveMultipleRaw(docs.map(doc => setMongoLanguage(doc)));

const modelSaveUnrestrictedRaw = Model.saveUnrestricted.bind(Model);
Model.saveUnrestricted = async doc => modelSaveUnrestrictedRaw(setMongoLanguage(doc));

export default Model;
