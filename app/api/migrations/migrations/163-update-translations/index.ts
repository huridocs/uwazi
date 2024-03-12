import { Db } from 'mongodb';

const newKeys = [
  { key: 'Thesauri updated.' },
  { key: 'Error updating thesauri.' },
  { key: 'Add item' },
  { key: 'Edit item' },
  { key: 'Thesauri added.' },
  { key: 'Error adding thesauri.' },
  { key: 'Thesauri deleted' },
  { key: 'Adding a group and its items.' },
  { key: 'You can add one or many items in this form.' },
  { key: 'Adding items to the thesauri' },
  {
    key: 'thesauri new group desc',
    value:
      'Each item created will live inside this group. Once you type the first item name, a new item form will appear underneath it, so you can keep on adding as many as you want.',
  },
  {
    key: 'thesauri new item desc',
    value:
      'Once you type the first item name, a new item form will appear underneath it, so you can keep on adding as many as you want.',
  },
];
const deletedKeys: any[] = [
  {
    key: 'Are you sure you want to delete this thesaurus?',
  },
  {
    key: 'Cannot delete thesaurus:',
  },
  {
    key: 'Configure suggestions',
  },
  {
    key: 'Confirm deletion of thesaurus:',
  },
  {
    key: 'Confirm edit suggestion-enabled Thesaurus',
  },
  {
    key: 'Delete Group',
  },
  {
    key: 'Documents to be reviewed',
  },
  {
    key: 'Group name',
  },
  {
    key: 'Item name',
  },
  {
    key: 'Label more documents',
  },
  {
    key: 'Learning...',
  },
  {
    key: 'Review unpublished document',
  },
  {
    key: 'Show Suggestions',
  },
  {
    key: 'Suggested labels description',
  },
  {
    key: 'The current model was trained at',
  },
  {
    key: 'The first step is to label a sample of your documents, so Uwazi can learn which topics to suggest when helping you label your collection.',
  },
  {
    key: 'This thesaurus is being used in document types and cannot be deleted.',
  },
  {
    key: 'Train model',
  },
  {
    key: 'Uwazi is learning using the labelled documents. This may take up to 2 hours, and once completed you can review suggestions made by Uwazi for your collection.',
  },
  {
    key: 'View suggestions',
  },
  {
    key: 'We recommend labeling',
  },
  {
    key: 'You can also improve the model by providing more labeled documents.',
  },
  {
    key: 'You have labeled',
  },
  {
    key: 'documents before training (30 per topic).',
  },
  {
    key: 'documents so far.',
  },
  {
    key: 'documents to be reviewed',
  },
  {
    key: 'topic suggestions tip',
  },
  {
    key: 'Add Thesaurus',
  },
  {
    key: 'Advanced',
  },
  {
    key: 'Code',
  },
  {
    key: 'Edit Group',
  },
];

export default {
  delta: 163,

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
          value: k.value || k.key,
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
