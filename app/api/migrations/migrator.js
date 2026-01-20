/* eslint-disable import/no-dynamic-require, global-require */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import migrationsModel from '#api/migrations/migrationsModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promiseInSequence = funcs =>
  funcs.reduce(
    (promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

const sortByDelta = migrations => migrations.sort((a, b) => a.delta - b.delta);

const getMigrations = async migrationsDir => {
  const [lastMigration] = await migrationsModel.get({}, null, { limit: 1, sort: { delta: -1 } });
  const files = await fs.readdir(migrationsDir);
  const migrationModules = await Promise.all(
    files.map(migration => import(pathToFileURL(path.join(migrationsDir, migration)).href))
  );
  let migrations = migrationModules.map(module => module.default);
  migrations = sortByDelta(migrations);
  if (lastMigration) {
    migrations = migrations.map(m => (m.delta > lastMigration.delta ? m : null)).filter(m => m);
  }
  return migrations;
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
