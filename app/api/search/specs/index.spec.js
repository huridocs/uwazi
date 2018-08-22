/* eslint-disable max-nested-callbacks */
import { catchErrors } from 'api/utils/jasmineHelpers';
import { index as elasticIndex } from 'api/config/elasticIndexes';
import { search, elastic } from 'api/search';
import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';

describe('search', () => {
  const elasticTesting = instanceElasticTesting('search_index_test');

  describe('when language is not supported (korean in this case)', () => {
    it('should index the fullText as child as "other" language (so searches can be performed)', (done) => {
      const entity = {
        _id: db.id(),
        sharedId: 'sharedIdOtherLanguage',
        type: 'document',
        title: 'Batman indexes',
        fullText: {
          1: '조',
          2: '선말'
        },
        language: 'en'
      };

      search.bulkIndex([entity])
      .then(() => elasticTesting.refresh())
      .then(() => search.searchSnippets('조', entity.sharedId, 'en'))
      .then((snippets) => {
        expect(snippets.length).toBe(1);
        return search.searchSnippets('nothing', entity.sharedId, 'en');
      })
      .then((snippets) => {
        expect(snippets.length).toBe(0);
        done();
      })
      .catch((e) => {
        done.fail(e);
      });
    });
  });

  describe('bulkIndex', () => {
    it('should update docs using the bulk functionality', (done) => {
      spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
      const toIndexDocs = [
        { _id: 'id1', title: 'test1', pdfInfo: 'Should not be included' },
        { _id: 'id2', title: 'test2', pdfInfo: 'Should not be included' }
      ];

      search.bulkIndex(toIndexDocs)
      .then(() => {
        expect(elastic.bulk).toHaveBeenCalledWith({ body: [
          { index: { _index: elasticIndex, _type: 'entity', _id: 'id1' } },
          { title: 'test1' },
          { index: { _index: elasticIndex, _type: 'entity', _id: 'id2' } },
          { title: 'test2' }
        ] });
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when docs have fullText', () => {
      it('should be indexed separatedly as a child of the doc', (done) => {
        spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
        const toIndexDocs = [
          { _id: 'id1', title: 'test1', fullText: { 1: 'this is an english test', 2: 'this is page2' } },
          { _id: 'id2', title: 'test2', fullText: { 1: 'text3[[1]]', 2: 'text4[[2]]' } }
        ];

        search.bulkIndex(toIndexDocs, 'index')
        .then(() => {
          const bulkIndexArguments = elastic.bulk.calls.allArgs()[0][0];
          expect(bulkIndexArguments).toEqual({ body: [
            { index: { _index: elasticIndex, _type: 'entity', _id: 'id1' } },
            { title: 'test1' },
            { index: { _index: elasticIndex, _type: 'fullText', parent: 'id1', _id: 'id1_fullText' } },
            { fullText_english: 'this is an english test\fthis is page2' },
            { index: { _index: elasticIndex, _type: 'entity', _id: 'id2' } },
            { title: 'test2' },
            { index: { _index: elasticIndex, _type: 'fullText', parent: 'id2', _id: 'id2_fullText' } },
            { fullText_other: 'text3[[1]]\ftext4[[2]]' }
          ] });
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('delete', () => {
    it('should delete the index', (done) => {
      spyOn(elastic, 'delete').and.returnValue(Promise.resolve());

      const id = db.id();

      const entity = {
        _id: id,
        type: 'document',
        title: 'Batman indexes'
      };

      search.delete(entity)
      .then(() => {
        expect(elastic.delete)
        .toHaveBeenCalledWith({ index: elasticIndex, type: 'entity', id: id.toString() });
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
