/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

interface Translation {
  key: string;
}

const newKeys: Translation[] = [
  { key: 'Do you want to delete the following items?' },
  { key: 'Already exists' },
];

const deletedKeys: Translation[] = [
  { key: 'Are you sure you want to delete this relationship type?' },
  { key: 'Cannot delete relationship type:' },
  { key: 'Confirm deletion of relationship type:' },
  { key: 'Currently connections only need a title.' },
  { key: 'This relationship type is being used and cannot be deleted.' },
];

export default {
  delta: 161,

  reindex: false,

  name: 'update_translations',

  description: 'Updates some translations in settings',

  async up(db: Db) {
    const settings = await db.collection('settings').findOne();
    const languages = settings?.languages
      .map((l: any) => l.key)
      .filter((value: string, index: number, array: any[]) => array.indexOf(value) === index);

    await db.collection('translationsV2').deleteMany({
      key: { $in: deletedKeys.concat(newKeys).map(k => k.key) },
      'context.id': 'System',
    });

    const insertMany = languages.map(async (l: any) =>
      db.collection('translationsV2').insertMany(
        newKeys.map(k => ({
          key: k.key,
          value: k.key,
          language: l,
          context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
        }))
      )
    );
    await Promise.all(insertMany);

    process.stdout.write(`${this.name}...\r\n`);
  },
};

export { newKeys, deletedKeys };
