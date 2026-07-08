import { fileURLToPath, pathToFileURL } from 'url';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import path, { dirname } from 'path';
import migrationsModel from './migrationsModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadMigration = p => import(pathToFileURL(p).href).then(m => m.default);

const sortByDelta = migrations => migrations.sort((a, b) => a.delta - b.delta);

const getMigrations = async (migrationsDir, loader = loadMigration) => {
  const [lastMigration] = await migrationsModel.get({}, null, { limit: 1, sort: { delta: -1 } });
  const files = await fs.readdir(migrationsDir);
  const loadedMigrations = await Promise.all(
    files
      .filter(f => !f.startsWith('.'))
      .map(migration => loader(path.join(migrationsDir, migration, 'index.js')))
  );
  let migrations = sortByDelta(loadedMigrations);
  if (lastMigration) {
    migrations = migrations.map(m => (m.delta > lastMigration.delta ? m : null)).filter(m => m);
  }
  return migrations;
};

const saveMigration = migration => migrationsModel.save(migration);

const getPendingMigrations = async (migrationsDir, loader, schemaVersion) => {
  const pending = await getMigrations(migrationsDir, loader);
  const runnable = [];
  let blocked = null;

  for (const migration of pending) {
    const requiredSchema = migration.requiresSchema || 0;
    if (requiredSchema <= schemaVersion) {
      runnable.push(migration);
    } else {
      blocked = { delta: migration.delta, requiresSchema: requiredSchema };
      break;
    }
  }

  return { runnable, blocked };
};

const migrateNext = async (migrationsDir, loader, db, schemaVersion = Number.MAX_SAFE_INTEGER) => {
  const { runnable, blocked } = await getPendingMigrations(migrationsDir, loader, schemaVersion);

  if (blocked && runnable.length === 0) {
    return { status: 'blocked', blocked };
  }

  if (runnable.length === 0) {
    return { status: 'done' };
  }

  const migration = runnable[0];
  await migration.up(db);
  await saveMigration(migration);
  return { status: 'applied', migration };
};

const migrateDelta = async (
  migrationsDir,
  loader,
  db,
  delta,
  schemaVersion = Number.MAX_SAFE_INTEGER
) => {
  const { runnable, blocked } = await getPendingMigrations(migrationsDir, loader, schemaVersion);

  const target = runnable.find(migration => migration.delta === delta);
  if (target) {
    await target.up(db);
    await saveMigration(target);
    return { status: 'applied', migration: target };
  }

  if (blocked && blocked.delta === delta) {
    return { status: 'blocked', blocked };
  }

  return { status: 'done' };
};

const migrator = {
  migrationsDir: `${__dirname}/migrations/`,
  loader: loadMigration,

  async migrate(db, schemaVersion = Number.MAX_SAFE_INTEGER) {
    const { runnable, blocked } = await getPendingMigrations(
      this.migrationsDir,
      this.loader,
      schemaVersion
    );

    const applied = [];
    for (const migration of runnable) {
      // eslint-disable-next-line no-await-in-loop
      await migration.up(db);
      // eslint-disable-next-line no-await-in-loop
      await saveMigration(migration);
      applied.push(migration);
    }

    return { migrations: applied, blocked };
  },
  async migrateNext(db, schemaVersion = Number.MAX_SAFE_INTEGER) {
    return migrateNext(this.migrationsDir, this.loader, db, schemaVersion);
  },
  async migrateDelta(db, delta, schemaVersion = Number.MAX_SAFE_INTEGER) {
    return migrateDelta(this.migrationsDir, this.loader, db, delta, schemaVersion);
  },
  shouldMigrate() {
    return getMigrations(this.migrationsDir, this.loader).then(migrations =>
      Boolean(migrations.length)
    );
  },
};

export { migrator, getMigrations, getPendingMigrations, sortByDelta, migrateNext, migrateDelta };
