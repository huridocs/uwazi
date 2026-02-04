/* eslint-disable import/no-dynamic-require, global-require */

import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { dirname } from 'path';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import migrationsModel from './migrationsModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const promiseInSequence = funcs =>
  funcs.reduce(
    (promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

const sortByDelta = migrations => migrations.sort((a, b) => a.delta - b.delta);

const getMigrations = async migrationsDir => {
  const [lastMigration] = await migrationsModel.get({}, null, { limit: 1, sort: { delta: -1 } });
  const files = await fs.readdir(migrationsDir);
  const migrations = await Promise.all(
    files.map(async migration => {
      const migrationPath = path.join(migrationsDir, migration);
      const stats = await fs.stat(migrationPath);
      const finalPath = stats.isDirectory() ? path.join(migrationPath, 'index.js') : migrationPath;
      const migrationUrl = pathToFileURL(finalPath).href;
      const module = await import(migrationUrl);
      return module.default;
    })
  );
  const sortedMigrations = sortByDelta(migrations);
  if (lastMigration) {
    return sortedMigrations.map(m => (m.delta > lastMigration.delta ? m : null)).filter(m => m);
  }
  return sortedMigrations;
};

const saveMigration = migration => migrationsModel.save(migration);

const migrator = {
  migrationsDir: `${__dirname}/migrations/`,

  async migrate(db) {
    return getMigrations(this.migrationsDir).then(migrations =>
      promiseInSequence(
        migrations.map(migration => () => migration.up(db).then(() => saveMigration(migration)))
      )
    );
  },
  shouldMigrate() {
    return getMigrations(this.migrationsDir).then(migrations => Boolean(migrations.length));
  },
};

export { migrator, getMigrations, sortByDelta };
