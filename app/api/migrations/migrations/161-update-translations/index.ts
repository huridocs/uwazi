import { Db } from 'mongodb';

const newKeys = [
  { key: 'Thesauri updated.' },
  { key: 'Error updating thesauri.' },
  { key: 'Add item' },
  { key: 'Edit item' },
  { key: 'Thesauri added.' },
  { key: 'Error adding thesauri.' },
  { key: 'Thesauri deleted' },
  { key: 'Add Thesaurus' },
  { key: 'Adding a group and its items.' },
  { key: 'You can add one or many items in this form.' },
  { key: 'Adding items to the thesauri' },
  {
    key: 'thesauri new group desc',
    value:
      ' Each item created will live inside this group. Once you type the first item name, a new item form will appear underneath it, so you can keep on adding as many as you want.',
  },
  {
    key: 'thesauri new item desc',
    value:
      ' Once you type the first item name, a new item form will appear underneath it, so you can keep on adding as many as you want.',
  },
  {
    key: 'Language (Default language)',
  },
];
const deletedKeys: any[] = [];

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
