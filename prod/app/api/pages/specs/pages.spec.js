"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _uniqueID = require("../../../shared/uniqueID");
var _date = _interopRequireDefault(require("../../utils/date.js"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));

var _fixtures = _interopRequireWildcard(require("./fixtures.js"));
var _pages = _interopRequireDefault(require("../pages.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('pages', () => {
  beforeEach(done => {
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('save', () => {
    it('should create a new document with logged user id and UTC date for each language', done => {
      spyOn(_date.default, 'currentUTC').and.returnValue(1);
      (0, _uniqueID.mockID)('sharedid');

      const doc = { title: 'Batman begins' };
      const user = { _id: _testing_db.default.id() };

      _pages.default.save(doc, user, 'es').
      then(result => Promise.all([
      _pages.default.getById(result.sharedId, 'es', 'title creationDate user'),
      _pages.default.getById(result.sharedId, 'en', 'title creationDate user'),
      _pages.default.getById(result.sharedId, 'pt', 'title creationDate user')])).

      then(([es, en, pt]) => {
        expect(es.title).toBe(doc.title);
        expect(en.title).toBe(doc.title);
        expect(pt.title).toBe(doc.title);
        expect(es.user.equals(user._id)).toBe(true);
        expect(es.creationDate).toEqual(1);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should return the newly created document', done => {
      const doc = { title: 'the dark knight' };
      const user = { _id: _testing_db.default.id() };

      _pages.default.save(doc, user, 'es').
      then(createdDocument => {
        expect(createdDocument._id.toString()).toBeDefined();
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.language).toBe('es');
        return _pages.default.get(createdDocument._id, 'creationDate user');
      }).
      then(([createdDocument]) => {
        expect(createdDocument.user.equals(user._id)).toBe(true);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when updating', () => {
      it('should not assign again user and creation date and partial update data', done => {
        spyOn(_date.default, 'currentUTC').and.returnValue(10);

        return _pages.default.save({ _id: _fixtures.pageToUpdate, sharedId: '1', title: 'Edited title' }, 'another_user').
        then(modifiedDoc => {
          expect(modifiedDoc.title).toBe('Edited title');
          return _pages.default.get(modifiedDoc._id, 'creationDate user');
        }).
        then(([doc]) => {
          expect(doc.user).not.toBe('another_user');
          expect(doc.creationDate).toBe(1);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });
  });

  describe('delete', () => {
    it('should delete the document in all languages', done => {
      const sharedId = '1';
      return _pages.default.delete(sharedId).
      then(() => _pages.default.get({ sharedId })).
      then(result => {
        expect(result.length).toBe(0);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('addLanguage()', () => {
    it('should duplicate all the pages from the default language to the new one', done => {
      _pages.default.addLanguage('ab').
      then(() => _pages.default.get({ language: 'ab' })).
      then(newPages => {
        expect(newPages.length).toBe(2);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('getById', () => {
    it('Throws 404 error on unexistent id', done => {
      _pages.default.getById('unexistent_id').then(() => {
        done.fail('It should throw and error');
      }).
      catch(error => {
        expect(error.code).toBe(404);
        done();
      });
    });
  });
});