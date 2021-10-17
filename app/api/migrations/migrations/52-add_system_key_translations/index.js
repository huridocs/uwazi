import { migrateTranslationsFromCSV } from 'api/migrations/systemTranslationsMigration';

export default {
  delta: 52,

  name: 'add_system_key_translations',

  description: 'Adding missing translations for system keys, through importing from a csv file.',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    await migrateTranslationsFromCSV(
      db,
      'app/api/migrations/migrations/52-add_system_key_translations/system_keys.csv'
    );
  },
};
