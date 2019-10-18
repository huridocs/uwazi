"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _translations = _interopRequireDefault(require("../../i18n/translations"));

var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _relationtypes = _interopRequireDefault(require("../relationtypes.js"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('relationtypes', () => {
  beforeEach(done => {
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('get()', () => {
    it('should return all the relationtypes in the database', done => {
      _relationtypes.default.get().
      then(result => {
        expect(result.length).toBe(3);
        expect(result[0].name).toBe('Against');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('getById()', () => {
    it('should return the relationtype with the id', done => {
      _relationtypes.default.getById(_fixtures.against).
      then(result => {
        expect(result.name).toBe('Against');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('save()', () => {
    beforeEach(() => {
      spyOn(_translations.default, 'addContext').and.returnValue(Promise.resolve());
      spyOn(_translations.default, 'updateContext').and.returnValue(Promise.resolve());
    });

    it('should generate names and ids for the properties', done => {
      _relationtypes.default.save({ name: 'Indiferent', properties: [{ label: 'Property one' }] }).
      then(result => {
        expect(result.properties[0].name).toBe('property_one');
        expect(result.properties[0]._id).toBeDefined();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when the relation type did not exist', () => {
      it('should create a new one and return it', done => {
        _relationtypes.default.save({ name: 'Indiferent', properties: [] }).
        then(result => {
          expect(result.name).toBe('Indiferent');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should create a new translation for it', done => {
        _relationtypes.default.save({ name: 'Indiferent', properties: [] }).
        then(response => {
          expect(_translations.default.addContext).toHaveBeenCalledWith(response._id, 'Indiferent', { Indiferent: 'Indiferent' }, 'Connection');
          done();
        }).catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('when the relation type exists', () => {
      it('should update it', done => {
        _relationtypes.default.getById(_fixtures.against).
        then(relationtype => {
          relationtype.name = 'Not that Against';
          return _relationtypes.default.save(relationtype);
        }).
        then(result => {
          expect(result.name).toBe('Not that Against');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should update the translation for it', done => {
        _relationtypes.default.getById(_fixtures.against).
        then(relationtype => {
          relationtype.name = 'Pro';
          return _relationtypes.default.save(relationtype);
        }).
        then(response => {
          expect(_translations.default.updateContext).toHaveBeenCalledWith(response._id, 'Pro', { Against: 'Pro' }, [], { Pro: 'Pro' }, 'Connection');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('when its duplicated', () => {
      it('should return an error', done => {
        const relationtype = { name: 'Against', properties: [] };
        return _relationtypes.default.save(relationtype).
        then((0, _jasmineHelpers.catchErrors)(done)).
        catch(error => {
          expect(error).toBe('duplicated_entry');
          done();
        });
      });
    });

    describe('delete()', () => {
      beforeEach(() => {
        spyOn(_translations.default, 'deleteContext').and.returnValue(Promise.resolve());
      });

      it('should remove it from the database and return true', done => {
        _relationtypes.default.delete(_fixtures.against).
        then(result => {
          expect(result).toBe(true);
          return _relationtypes.default.getById(_fixtures.against);
        }).
        then(response => {
          expect(response).toBe(null);
          done();
        });
      });

      it('should remove the translation', done => {
        _relationtypes.default.delete(_fixtures.against).
        then(() => {
          expect(_translations.default.deleteContext).toHaveBeenCalledWith(_fixtures.against);
          done();
        });
      });

      it('when its been used should not delete it and return false', done => {
        _relationtypes.default.delete(_fixtures.canNotBeDeleted).
        then(result => {
          expect(result).toBe(false);
          return _relationtypes.default.getById(_fixtures.canNotBeDeleted);
        }).
        then(result => {
          expect(result._id.equals(_fixtures.canNotBeDeleted)).toBe(true);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });
  });
});