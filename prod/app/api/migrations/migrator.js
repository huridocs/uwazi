"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));

var _migrationsModel = _interopRequireDefault(require("./migrationsModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable import/no-dynamic-require, global-require */

const promiseInSequence = funcs => funcs.reduce((promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))),
Promise.resolve([]));

const sortByDelta = migrations => migrations.sort((a, b) => a.delta - b.delta);

const getMigrations = migrationsDir => new Promise(resolve => {
  _migrationsModel.default.get({}, null, { limit: 1, sort: { delta: -1 } }).
  then(([lastMigration]) => {
    _fs.default.readdir(migrationsDir, (err, files) => {
      let migrations = files.map(migration => require(_path.default.join(migrationsDir, migration)).default);
      migrations = sortByDelta(migrations);
      if (lastMigration) {
        migrations = migrations.map(m => m.delta > lastMigration.delta ? m : null).filter(m => m);
      }
      resolve(migrations);
    });
  });
});

const saveMigration = migration => _migrationsModel.default.save(migration);var _default =

{
  migrationsDir: `${__dirname}/migrations/`,

  migrate() {
    const { db } = _mongoose.default.connections[0];

    return getMigrations(this.migrationsDir).
    then(migrations => promiseInSequence(migrations.map(migration => () => migration.up(db).then(() => saveMigration(migration)))));
  },
  shouldMigrate() {
    return getMigrations(this.migrationsDir).then(migrations => Boolean(migrations.length));
  } };exports.default = _default;