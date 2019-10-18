"use strict";require("jest-extended");

var _path = _interopRequireDefault(require("path"));

var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _migrationTest = _interopRequireDefault(require("./testMigrations/1-migrationTest"));
var _migrationTest2 = _interopRequireDefault(require("./testMigrations/10-migrationTest"));
var _migrationTest3 = _interopRequireDefault(require("./testMigrations/2-migrationTest"));
var _migrationsModel = _interopRequireDefault(require("../migrationsModel"));
var _migrator = _interopRequireDefault(require("../migrator"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migrator', () => {
  beforeEach(done => {
    _testing_db.default.clearAllAndLoad({}).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have migrations directory configured', () => {
    expect(_migrator.default.migrationsDir).toBe(_path.default.normalize(`${__dirname}/../migrations/`));
  });

  describe('migrate', () => {
    beforeEach(() => {
      _migrator.default.migrationsDir = _path.default.join(__dirname, 'testMigrations');
      jest.spyOn(_migrationTest.default, 'up');
      jest.spyOn(_migrationTest3.default, 'up');
      jest.spyOn(_migrationTest2.default, 'up');
    });

    it('should execute all migrations in order', done => {
      _migrator.default.migrate().
      then(() => {
        expect(_migrationTest.default.up).toHaveBeenCalled();
        expect(_migrationTest3.default.up).toHaveBeenCalled();
        expect(_migrationTest2.default.up).toHaveBeenCalled();

        expect(_migrationTest.default.up).toHaveBeenCalledBefore(_migrationTest3.default.up);
        expect(_migrationTest3.default.up).toHaveBeenCalledBefore(_migrationTest2.default.up);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should save migrations run on the db', done => {
      _migrator.default.migrate().
      then(() => _migrationsModel.default.get()).
      then(migrations => {
        expect(migrations.map(m => m.delta)).toEqual([1, 2, 10]);
        done();
      });
    });

    it('should only run migrations that had not been run before', done => {
      _migrationTest.default.up.mockClear();
      _migrationTest3.default.up.mockClear();
      _migrationTest2.default.up.mockClear();

      _migrationsModel.default.save({ delta: 1 }).
      then(() => _migrator.default.migrate()).
      then(() => {
        expect(_migrationTest.default.up).not.toHaveBeenCalled();
        expect(_migrationTest3.default.up).toHaveBeenCalled();
        expect(_migrationTest2.default.up).toHaveBeenCalled();
        expect(_migrationTest3.default.up).toHaveBeenCalledBefore(_migrationTest2.default.up);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should only run migrations that had not been run before', done => {
      _migrationTest.default.up.mockClear();
      _migrationTest3.default.up.mockClear();
      _migrationTest2.default.up.mockClear();

      _migrationsModel.default.save([{ delta: 1 }, { delta: 2 }]).
      then(() => _migrator.default.migrate()).
      then(() => {
        expect(_migrationTest.default.up).not.toHaveBeenCalled();
        expect(_migrationTest3.default.up).not.toHaveBeenCalled();
        expect(_migrationTest2.default.up).toHaveBeenCalled();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should not run any migration when the last one has already been run', done => {
      _migrationTest.default.up.mockClear();
      _migrationTest3.default.up.mockClear();
      _migrationTest2.default.up.mockClear();

      _migrationsModel.default.save([{ delta: 10 }]).
      then(() => _migrator.default.migrate()).
      then(() => {
        expect(_migrationTest.default.up).not.toHaveBeenCalled();
        expect(_migrationTest3.default.up).not.toHaveBeenCalled();
        expect(_migrationTest2.default.up).not.toHaveBeenCalled();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});