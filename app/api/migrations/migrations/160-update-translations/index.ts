import { Db } from 'mongodb';

const newKeys = [
  { key: 'New page' },
  { key: 'Basic' },
  { key: 'View page' },
  { key: 'Javascript' },
  { key: 'Save & Preview' },
  { key: 'Entity Page' },
  { key: 'Yes' },
  { key: 'Are you sure?' },
  { key: 'No, cancel' },
  { key: 'Other users will be affected by this action!' },
  { key: 'You are about to delete a page' },
];

const deletedKeys = [
  { key: 'Confirm deletion of page:' },
  { key: 'Page Javascript' },
  { key: 'Page name' },
  { key: 'Are you sure you want to delete this page?' },
  { key: '(view page)' },
  { key: '// Javascript - With great power comes great responsibility!' },
];

export default {
  delta: 160,

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
