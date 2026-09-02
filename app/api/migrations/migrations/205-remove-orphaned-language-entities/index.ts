import { Db } from 'mongodb';

import { Settings } from './types.js';

const getInstalledLanguageKeys = async (db: Db): Promise<string[]> => {
  const settings = await db.collection<Settings>('settings').findOne({});
  return (settings?.languages || []).map(language => language.key).filter(Boolean);
};

export default {
  delta: 205,

  name: 'remove-orphaned-language-entities',

  description:
    'Removes entity documents whose language is not installed (orphans from the legacy V1 language add/delete race)',

  reindex: false,

  requiresSchema: 14,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const installedKeys = await getInstalledLanguageKeys(db);

    if (installedKeys.length === 0) {
      process.stdout.write(
        `${this.name}: no languages configured in settings, skipping to avoid mass deletion.\r\n`
      );
      this.reindex = false;
      return;
    }

    const result = await db
      .collection('entities')
      .deleteMany({ language: { $nin: [...installedKeys, null, ''] } });

    // Set the flag deterministically from this tenant's own result: the module is
    // cached by the loader and shared across tenants, so a stale `true` from a
    // previous tenant must not leak into this run.
    this.reindex = result.deletedCount > 0;

    process.stdout.write(
      `${this.name}: removed ${result.deletedCount} orphaned entity document(s).\r\n`
    );
  },
};
