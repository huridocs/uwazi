export default {
  delta: 145,

  name: 'remove-obsolete-translation-keys-in-v2',

  description:
    'The migration removes known obsoleted entries in the System context of translations V2.',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    await db.collection('translationsV2').deleteMany({ key: 'Confirm New Passowrd' });
    await db.collection('translationsV2').deleteMany({ key: 'New Password' });
  },
};
