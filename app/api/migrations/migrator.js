/* eslint-disable import/no-dynamic-require, global-require */

import mongoose from 'mongoose';

import fs from 'fs';
import path from 'path';

import migrationsModel from './migrationsModel';

const promiseInSequence = funcs =>
  funcs.reduce(
    (promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

const sortByDelta = migrations => migrations.sort((a, b) => a.delta - b.delta);

const getMigrations = migrationsDir =>
  new Promise(resolve => {
    migrationsModel.get({}, null, { limit: 1, sort: { delta: -1 } }).then(([lastMigration]) => {
      fs.readdir(migrationsDir, (_err, files) => {
        let migrations = files.map(
          migration => require(path.join(migrationsDir, migration)).default
        );
        migrations = sortByDelta(migrations);
        if (lastMigration) {
          migrations = migrations
            .map(m => (m.delta > lastMigration.delta ? m : null))
            .filter(m => m);
        }
        resolve(migrations);
      });
    });
  });

const saveMigration = migration => migrationsModel.save(migration);

export default {
  migrationsDir: `${__dirname}/migrations/`,

  migrate() {
    const { db } = mongoose.connections[0];

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
