import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import migrationsModel from './migrationsModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadMigration = p =>
  import(pathToFileURL(p).href).then(m => m.default);

const promiseInSequence = funcs =>
  funcs.reduce(
    (promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

const sortByDelta = migrations => migrations.sort((a, b) => a.delta - b.delta);

const getMigrations = async (migrationsDir, loader = loadMigration) => {
  const [lastMigration] = await migrationsModel.get({}, null, { limit: 1, sort: { delta: -1 } });
  const files = await fs.readdir(migrationsDir);
  let migrations = await Promise.all(
    files
      .filter(f => !f.startsWith('.'))
      .map(migration => loader(path.join(migrationsDir, migration, 'index.js')))
  );
  migrations = sortByDelta(migrations);
  if (lastMigration) {
    migrations = migrations.map(m => (m.delta > lastMigration.delta ? m : null)).filter(m => m);
  }
  return migrations;
};

const saveMigration = migration => migrationsModel.save(migration);

const migrator = {
  migrationsDir: `${__dirname}/migrations/`,
  loader: loadMigration,

  async migrate(db) {
    return getMigrations(this.migrationsDir, this.loader).then(migrations =>
      promiseInSequence(
        migrations.map(migration => () => migration.up(db).then(() => saveMigration(migration)))
      )
    );
  },
  shouldMigrate() {
    return getMigrations(this.migrationsDir, this.loader).then(migrations => Boolean(migrations.length));
  },
};

export { migrator, getMigrations, sortByDelta };
