import { Db } from 'mongodb';

const newKeys = [
  { key: 'Reset passwords' },
  { key: 'Do you want to delete the following items?' },
  { key: 'Do you want disable 2FA for the following users?' },
  { key: 'Do you want reset the password for the following users?' },
];

export default {
  delta: 161,

  reindex: false,

  name: 'update_translations',

  description: 'Updates some translations in settings',

  async up(db: Db) {
    const documents: any[] = [];
    const settings = await db.collection('settings').findOne();
    settings?.languages
      .map((l: any) => l.key)
      .filter((value: string, index: number, array: any[]) => array.indexOf(value) === index)
      .forEach((l: any) =>
        newKeys.map(k =>
          documents.push({
            key: k.key,
            value: k.key,
            language: l,
            context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
          })
        )
      );

    await db.collection('translationsV2').insertMany(documents);

    process.stdout.write(`${this.name}...\r\n`);
  },
};

export { newKeys };
