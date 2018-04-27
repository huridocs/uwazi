/* eslint-disable import/no-dynamic-require, global-require */

import mongoose from 'mongoose';

import fs from 'fs';
import path from 'path';

import migrationsModel from './migrationsModel';

const promiseInSequence = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]));

const sortByVersion = migrations => migrations.sort((a, b) => a.version - b.version);

const getMigrations = migrationsDir =>
  new Promise((resolve) => {
    migrationsModel.get({}, null, { limit: 1, sort: { version: -1 } })
    .then(([lastMigration]) => {
      fs.readdir(migrationsDir, (err, files) => {
        let migrations = files.map(migration => require(path.join(migrationsDir, migration)));
        migrations = sortByVersion(migrations);
        if (lastMigration) {
          migrations = migrations.map(m => m.version > lastMigration.version ? m : null).filter(m => m);
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

    return getMigrations(this.migrationsDir)
    .then(migrations => promiseInSequence(migrations.map(migration => () => migration.up(db).then(() => saveMigration(migration)))));
  }
};
