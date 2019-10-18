"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _date = _interopRequireDefault(require("../../utils/date.js"));
var _fs = _interopRequireDefault(require("fs"));
var _uniqueID = require("../../../shared/uniqueID");
var _relationships = _interopRequireDefault(require("../../relationships"));
var _entities = _interopRequireDefault(require("../../entities"));
var _search = _interopRequireDefault(require("../../search/search"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _path = _interopRequireDefault(require("path"));
var _documents = _interopRequireDefault(require("../documents.js"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));
var _paths = _interopRequireDefault(require("../../config/paths"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('documents', () => {
  beforeEach(done => {
    spyOn(_relationships.default, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());
    spyOn(_search.default, 'delete').and.returnValue(Promise.resolve());
    spyOn(_search.default, 'bulkIndex').and.returnValue(Promise.resolve());
    (0, _uniqueID.mockID)();
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('get', () => {
    describe('when passing query', () => {
      it('should return matching document', done => {
        _documents.default.get({ sharedId: 'shared' }).
        then(docs => {
          expect(docs[1].title).toBe('Penguin almost done');
          expect(docs[1].fullText).not.toBeDefined();
          expect(docs[0].title).toBe('Batman finishes');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });
  });

  describe('save', () => {
    it('should call entities.save', done => {
      spyOn(_entities.default, 'save').and.returnValue(Promise.resolve('result'));
      const doc = { title: 'Batman begins' };
      const user = { _id: _testing_db.default.id() };
      const language = 'es';

      _documents.default.save(doc, { user, language }).
      then(docs => {
        expect(_entities.default.save).toHaveBeenCalledWith({ title: 'Batman begins' }, { user, language });
        expect(docs).toBe('result');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should not allow passing a file', done => {
      spyOn(_entities.default, 'save').and.returnValue(Promise.resolve('result'));
      const doc = { title: 'Batman begins', file: 'file' };
      const user = { _id: _testing_db.default.id() };
      const language = 'es';

      _documents.default.save(doc, { user, language }).
      then(docs => {
        expect(_entities.default.save).toHaveBeenCalledWith({ title: 'Batman begins' }, { user, language });
        expect(docs).toBe('result');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should assign unique ids to toc entries', done => {
      spyOn(_date.default, 'currentUTC').and.returnValue(1);
      const doc = { title: 'Batman begins', toc: [{}, {}], template: _fixtures.templateId };
      const user = { _id: _testing_db.default.id() };

      _documents.default.save(doc, { user, language: 'es' }).
      then(() => _documents.default.getById('unique_id', 'es')).
      then(result => {
        expect(result.toc[0]._id.toString()).toBeDefined();
        expect(result.toc[1]._id).toBeDefined();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      _fs.default.writeFileSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccb.pdf'));
      _fs.default.writeFileSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014cc1.pdf'));
      _fs.default.writeFileSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccc.pdf'));
    });

    it('should delete the document in the database', done => _documents.default.delete('shared').
    then(() => _documents.default.getById('shared', 'es')).
    then(result => {
      expect(result).not.toBeDefined();
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done)));

    it('should delete the original file', done => {
      _documents.default.delete('shared').
      then(() => {
        expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccb.pdf'))).toBe(false);
        expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014cc1.pdf'))).toBe(false);
        expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccc.pdf'))).toBe(false);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});