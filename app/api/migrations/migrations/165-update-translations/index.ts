import { Db } from 'mongodb';

const newKeys = [
  { key: 'Reset passwords' },
  { key: 'Import asset' },
  { key: 'File name' },
  { key: 'remaining files' },
  { key: 'Do you want to delete the following items?' },
  { key: 'Do you want disable 2FA for the following users?' },
  { key: 'Do you want reset the password for the following users?' },
];

const deletedKeys: { key: string }[] = [{ key: 'You are about to delete a page' }];

export default {
  delta: 165,

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
