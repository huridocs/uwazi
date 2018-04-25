/* eslint-disable max-nested-callbacks */
import { index as elasticIndex } from 'api/config/elasticIndexes';
import { search, elastic } from 'api/search';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import languages from 'shared/languages';

describe('search', () => {
  const elasticTesting = instanceElasticTesting('search_index_test');

  describe('index', () => {
    it('should index the document (omitting pdfInfo), without side effects on the sent element', (done) => {
      spyOn(elastic, 'index').and.returnValue(Promise.resolve());

      const entity = {
        _id: 'asd1',
        type: 'document',
        title: 'Batman indexes',
        pdfInfo: 'Should not be included'
      };

      search.index(entity)
      .then(() => {
        expect(entity._id).toBe('asd1');
        expect(elastic.index)
        .toHaveBeenCalledWith({
          index: elasticIndex,
          type: 'entity',
          id: 'asd1',
          body: {
            type: 'document',
            title: 'Batman indexes'
          }
        });
        done();
      })
      .catch(done.fail);
    });

    describe('when document has fullText', () => {
      it('should index the fullText as child with proper language', (done) => {
        spyOn(elastic, 'index').and.returnValue(Promise.resolve());
        spyOn(languages, 'detect').and.returnValue('english');

        const entity = {
          _id: 'asd1',
          type: 'document',
          title: 'Batman indexes',
          fullText: 'text'
        };

        search.index(entity)
        .then(() => {
          expect(elastic.index)
          .toHaveBeenCalledWith({ index: elasticIndex, type: 'entity', id: 'asd1', body: { type: 'document', title: 'Batman indexes' } });
          expect(elastic.index)
          .toHaveBeenCalledWith({ index: elasticIndex, type: 'fullText', parent: 'asd1', body: { fullText_english: 'text' }, id: 'asd1_fullText' });
          done();
        })
        .catch(done.fail);
      });

      describe('when language is not supported (korean in this case)', () => {
        it('should index the fullText as child as "other" language (so searches can be performed)', (done) => {
          const entity = {
            _id: db.id(),
            sharedId: 'sharedIdOtherLanguage',
            type: 'document',
            title: 'Batman indexes',
            fullText: '조 선말',
            language: 'en'
          };

          search.index(entity)
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
        spyOn(languages, 'detect').and.returnValue('english');
        const toIndexDocs = [
          { _id: 'id1', title: 'test1', fullText: 'text1' },
          { _id: 'id2', title: 'test2', fullText: 'text2' }
        ];

        search.bulkIndex(toIndexDocs, 'index')
        .then(() => {
          expect(elastic.bulk).toHaveBeenCalledWith({ body: [
            { index: { _index: elasticIndex, _type: 'entity', _id: 'id1' } },
            { title: 'test1' },
            { index: { _index: elasticIndex, _type: 'fullText', parent: 'id1', _id: 'id1_fullText' } },
            { fullText_english: 'text1' },
            { index: { _index: elasticIndex, _type: 'entity', _id: 'id2' } },
            { title: 'test2' },
            { index: { _index: elasticIndex, _type: 'fullText', parent: 'id2', _id: 'id2_fullText' } },
            { fullText_english: 'text2' }
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
