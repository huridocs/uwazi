import { Db, ObjectId } from 'mongodb';
import { Language, Settings, Template, TranslationDBO } from './types';

const recoveryTemplateId = new ObjectId();

const recoveryTemplate: Template = {
  _id: recoveryTemplateId,
  name: '__recovered_entities__',
  commonProperties: [
    {
      _id: new ObjectId(),
      label: 'Title',
      name: 'title',
      isCommonProperty: true,
      type: 'text' as 'text',
      prioritySorting: false,
    },
    {
      _id: new ObjectId(),
      label: 'Date added',
      name: 'creationDate',
      isCommonProperty: true,
      type: 'date' as 'date',
      prioritySorting: false,
    },
    {
      _id: new ObjectId(),
      label: 'Date modified',
      name: 'editDate',
      isCommonProperty: true,
      type: 'date' as 'date',
      prioritySorting: false,
    },
  ],
  properties: [],
  color: '#ff0000',
};

const recoveryTemplateTranslationContext: TranslationDBO['context'] = {
  type: 'Entity',
  label: recoveryTemplate.name,
  id: recoveryTemplate._id!.toString(),
};

const recoveryTemplateTranslationsForLanguage = (languageKey: Language['key']) => [
  {
    _id: new ObjectId(),
    language: languageKey,
    key: 'Title',
    value: 'Title',
    context: recoveryTemplateTranslationContext,
  },
  {
    _id: new ObjectId(),
    language: languageKey,
    key: recoveryTemplate.name,
    value: recoveryTemplate.name,
    context: recoveryTemplateTranslationContext,
  },
];

const insertRecoveryTemplateTranslations = async (db: Db) => {
  const settings = await db.collection<Settings>('settings').findOne();
  const translations = settings?.languages
    ?.map(l => recoveryTemplateTranslationsForLanguage(l.key))
    .flat();
  if (translations) {
    await db.collection<TranslationDBO>('translationsV2').insertMany(translations);
  }
};

export default {
  delta: 163,

  name: 'supplement-missing-entity-templates',

  description:
    'This migration adds the default template to all entities that are missing a template.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const updateFilter = {
      $or: [{ template: { $exists: false } }, { template: { $in: [null, undefined] } }],
    };

    const preliminaryUpdateCount = await db.collection('entities').countDocuments(updateFilter);

    if (!preliminaryUpdateCount) return;

    await db.collection<Template>('templates').insertOne(recoveryTemplate);
    await insertRecoveryTemplateTranslations(db);

    const updateResult = await db
      .collection('entities')
      .updateMany(updateFilter, { $set: { template: recoveryTemplateId, published: false } });

    if (updateResult.modifiedCount) this.reindex = true;
  },
};
