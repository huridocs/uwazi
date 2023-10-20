const newKeys = [
  { key: 'Suggestion accepted.' },
  { key: 'Showing' },
  { key: 'Accept suggestion' },
  { key: 'Stats & Filters' },
  { key: 'Labeled' },
  { key: 'Non-labeled' },
  { key: 'Pending' },
  { key: 'Clear all' },
  { key: 'Apply' },
  { key: 'Current value:' },
  { key: 'Suggestion:' },
  { key: 'Current Value/Suggestion' },
  { key: 'No context' },
];

const deletedKeys = [
  { key: 'Reviewing' },
  { key: 'Confirm suggestion acceptance' },
  { key: 'Apply to all languages' },
  { key: 'Back to dashboard' },
  { key: 'Match / Label' },
  { key: 'Mismatch / Label' },
  { key: 'Match / Value' },
  { key: 'Mismatch / Value' },
  { key: 'Empty / Label' },
  { key: 'Empty / Value' },
  { key: 'State Legend' },
  { key: 'labelMatchDesc' },
  { key: 'labelMismatchDesc' },
  { key: 'labelEmptyDesc' },
  { key: 'valueMatchDesc' },
  { key: 'valueMismatchDesc' },
  { key: 'valueEmptyDesc' },
  { key: 'obsoleteDesc' },
  { key: 'emptyDesc' },
  { key: 'This will update the entity across all languages' },
  { key: 'Mismatch / Empty' },
  { key: 'Empty / Empty' },
  { key: 'emptyMismatchDesc' },
  { key: 'Non-matching' },
  { key: 'Empty / Obsolete' },
  { key: 'This will cancel the finding suggestion process' },
  { key: 'Add properties' },
  { key: 'Show Filters' },
];

export default {
  delta: 147,

  reindex: false,

  name: 'update_translations',

  description: 'Updates some translations for new User/Groups UI in settings',

  async up(db) {
    const settings = await db.collection('settings').findOne();
    const languages = settings.languages.map(l => l.key);
    await db
      .collection('translationsV2')
      .deleteMany({ key: { $in: deletedKeys.map(k => k.key) }, 'context.id': 'System' });

    const insertMany = languages.map(l =>
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
