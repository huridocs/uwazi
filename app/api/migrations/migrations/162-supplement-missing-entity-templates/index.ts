import { Db, ObjectId } from 'mongodb';
import { Template } from './types';

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
  color: '##ff0000',
};

export default {
  delta: 162,

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

    const updateResult = await db
      .collection('entities')
      .updateMany(updateFilter, { $set: { template: recoveryTemplateId } });

    if (updateResult.modifiedCount) this.reindex = true;
  },
};
