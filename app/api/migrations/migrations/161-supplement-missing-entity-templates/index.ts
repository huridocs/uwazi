import { Db } from 'mongodb';
import { Template } from './types';

export default {
  delta: 161,

  name: 'supplement-missing-entity-templates',

  description:
    'This migration adds the default template to all entities that are missing a template.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const defaultTemplateId = (
      await db.collection<Template>('templates').findOne({ default: true })
    )?._id;
    if (!defaultTemplateId) return;

    const updateResult = await db
      .collection('entities')
      .updateMany(
        { $or: [{ template: { $exists: false } }, { template: { $in: [null, undefined] } }] },
        { $set: { template: defaultTemplateId } }
      );

    if (updateResult.modifiedCount) this.reindex = true;
  },
};
