import { migrateTranslations } from 'api/migrations/systemTranslationsMigration';

export default {
  delta: 55,

  name: 'add_system_key_translations',

  description: 'Inserts system keys of added translations',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const systemKeys = [{ key: 'FEATURED' }, { key: 'ALL' }];
    await migrateTranslations(db, systemKeys);
  },
};
