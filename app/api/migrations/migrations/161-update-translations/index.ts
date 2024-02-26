import { Db } from 'mongodb';

const newKeys = [
  { key: 'Do you want to delete the following items?' },
  { key: 'Reset passwords' },
  { key: 'Do you want reset the password for the following users?' },
  { key: 'Do you want disable 2FA for the following users?' },
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

export { newKeys };
