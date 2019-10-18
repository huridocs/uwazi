"use strict";
var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _errorLog = _interopRequireDefault(require("../../log/errorLog"));
var _elasticIndexes = _interopRequireDefault(require("../../config/elasticIndexes"));
var _ = require("./..");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _elastic_testing = _interopRequireDefault(require("../../utils/elastic_testing"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-nested-callbacks */


describe('search', () => {
  const elasticTesting = (0, _elastic_testing.default)('search_index_test');
  const elasticIndex = _elasticIndexes.default.index;

  beforeAll(done => {
    _testing_db.default.clearAllAndLoad({}).then(done);
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('when language is not supported (korean in this case)', () => {
    it('should index the fullText as child as "other" language (so searches can be performed)', done => {
      const entity = {
        _id: _testing_db.default.id(),
        sharedId: 'sharedIdOtherLanguage',
        type: 'document',
        title: 'Batman indexes',
        fullText: {
          1: '조',
          2: '선말' },

        language: 'en' };


      _.search.bulkIndex([entity]).
      then(() => elasticTesting.refresh()).
      then(() => _.search.searchSnippets('조', entity.sharedId, 'en')).
      then(snippets => {
        expect(snippets.fullText.length).toBe(1);
        return _.search.searchSnippets('nothing', entity.sharedId, 'en');
      }).
      then(snippets => {
        expect(snippets.fullText.length).toBe(0);
        done();
      }).
      catch(e => {done.fail(e);});
    });
  });

  describe('bulkIndex', () => {
    it('should update docs using the bulk functionality', done => {
      spyOn(_.elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
      const toIndexDocs = [
      { _id: 'id1', title: 'test1', pdfInfo: 'Should not be included' },
      { _id: 'id2', title: 'test2', pdfInfo: 'Should not be included' }];


      _.search.bulkIndex(toIndexDocs).
      then(() => {
        expect(_.elastic.bulk).toHaveBeenCalledWith({ body: [
          { index: { _index: elasticIndex, _type: 'entity', _id: 'id1' } },
          { title: 'test1' },
          { index: { _index: elasticIndex, _type: 'entity', _id: 'id2' } },
          { title: 'test2' }] });

        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when docs have fullText', () => {
      it('should be indexed separatedly as a child of the doc', done => {
        spyOn(_.elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
        const toIndexDocs = [
        { _id: 'id1', title: 'test1', fullText: { 1: 'this is an english test', 2: 'this is page2' } },
        { _id: 'id2', title: 'test2', fullText: { 1: 'text3[[1]]', 2: 'text4[[2]]' } }];


        _.search.bulkIndex(toIndexDocs, 'index').
        then(() => {
          const bulkIndexArguments = _.elastic.bulk.calls.allArgs()[0][0];
          expect(bulkIndexArguments).toEqual({ body: [
            { index: { _index: elasticIndex, _type: 'entity', _id: 'id1' } },
            { title: 'test1' },
            { index: { _index: elasticIndex, _type: 'fullText', parent: 'id1', _id: 'id1_fullText' } },
            { fullText_english: 'this is an english test\fthis is page2' },
            { index: { _index: elasticIndex, _type: 'entity', _id: 'id2' } },
            { title: 'test2' },
            { index: { _index: elasticIndex, _type: 'fullText', parent: 'id2', _id: 'id2_fullText' } },
            { fullText_other: 'text3[[1]]\ftext4[[2]]' }] });

          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('when there is an indexation error', () => {
      it('should log the error with the id of the document and the error message', async () => {
        spyOn(_.elastic, 'bulk').
        and.returnValue(Promise.resolve({ items: [{ index: { _id: '_id1', error: 'something terrible happened' } }] }));
        spyOn(_errorLog.default, 'error');
        const toIndexDocs = [{ _id: 'id1', title: 'test1' }];
        await _.search.bulkIndex(toIndexDocs, 'index');

        expect(_errorLog.default.error).toHaveBeenCalledWith('ERROR Failed to index document _id1: "something terrible happened"');
      });
    });
  });

  describe('delete', () => {
    it('should delete the index', done => {
      spyOn(_.elastic, 'delete').and.returnValue(Promise.resolve());

      const id = _testing_db.default.id();

      const entity = {
        _id: id,
        type: 'document',
        title: 'Batman indexes' };


      _.search.delete(entity).
      then(() => {
        expect(_.elastic.delete).
        toHaveBeenCalledWith({ index: elasticIndex, type: 'entity', id: id.toString() });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('bulkdelete', () => {
    it('should delete documents in a bulk action', done => {
      spyOn(_.elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
      const entities = [
      { _id: 'id1', title: 'test1', pdfInfo: 'Should not be included' },
      { _id: 'id2', title: 'test2', pdfInfo: 'Should not be included' }];


      _.search.bulkDelete(entities).
      then(() => {
        expect(_.elastic.bulk).toHaveBeenCalledWith({ body: [
          { delete: { _index: elasticIndex, _type: 'entity', _id: 'id1' } },
          { delete: { _index: elasticIndex, _type: 'entity', _id: 'id2' } }] });

        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('deleteLanguage', () => {
    it('should delete the index', done => {
      spyOn(_.elastic, 'deleteByQuery').and.returnValue(Promise.resolve());
      _.search.deleteLanguage('en').
      then(() => {
        expect(_.elastic.deleteByQuery).
        toHaveBeenCalledWith({ index: elasticIndex, body: { query: { match: { language: 'en' } } } });
        done();
      });
    });
  });
});