// eslint-disable max-nested-callbacks

import { catchErrors } from 'api/utils/jasmineHelpers';
import errorLog from 'api/log/errorLog';
import { elastic } from 'api/search';
import { instanceSearch } from 'api/search/search';
import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import { fixturesTimeOut } from './fixtures_elastic';

describe('search', () => {
  const elasticIndex = 'index_for_index_testing';
  const search = instanceSearch(elasticIndex);
  const elasticTesting = instanceElasticTesting(elasticIndex, search);

  beforeAll(async () => {
    await db.clearAllAndLoad({});
    await elasticTesting.resetIndex();
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
  });

  describe('when language is not supported (korean in this case)', () => {
    it('should index the fullText as child as "other" language (so searches can be performed)', async () => {
      const entity = {
        _id: db.id(),
        sharedId: 'sharedIdOtherLanguage',
        title: 'Batman indexes',
        documents: [
          {
            fullText: {
              1: '조',
              2: '선말',
            },
          },
        ],
        language: 'en',
      };

      await search.bulkIndex([entity], 'index', elasticIndex);
      await elasticTesting.refresh();
      let snippets = await search.searchSnippets('조', entity.sharedId, 'en');

      expect(snippets.fullText.length).toBe(1);
      snippets = await search.searchSnippets('nothing', entity.sharedId, 'en');

      expect(snippets.fullText.length).toBe(0);
    });
  });

  describe('bulkIndex', () => {
    it('should update docs using the bulk functionality', done => {
      spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
      const toIndexDocs = [
        { _id: 'id1', title: 'test1', pdfInfo: 'Should not be included' },
        { _id: 'id2', title: 'test2', pdfInfo: 'Should not be included' },
      ];

      search
        .bulkIndex(toIndexDocs)
        .then(() => {
          expect(elastic.bulk).toHaveBeenCalledWith({
            body: [
              { index: { _index: elasticIndex, _id: 'id1' } },
              { title: 'test1', fullText: 'entity', documents: [] },
              { index: { _index: elasticIndex, _id: 'id2' } },
              { title: 'test2', fullText: 'entity', documents: [] },
            ],
            requestTimeout: 40000,
          });
          done();
        })
        .catch(catchErrors(done));
    });

    describe('when docs have fullText', () => {
      it('should be indexed separatedly as a child of the doc', done => {
        spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
        const toIndexDocs = [
          {
            _id: 'id1',
            title: 'test1',
            documents: [
              {
                filename: 'file1',
                fullText: { 1: 'this is an english test', 2: 'this is page2' },
              },
            ],
          },
          {
            _id: 'id2',
            title: 'test2',
            documents: [{ filename: 'file2', fullText: { 1: 'text3[[1]]', 2: 'text4[[2]]' } }],
          },
        ];

        search
          .bulkIndex(toIndexDocs, 'index')
          .then(() => {
            const bulkIndexArguments = elastic.bulk.calls.allArgs()[0][0];
            expect(bulkIndexArguments).toEqual({
              body: [
                { index: { _index: elasticIndex, _id: 'id1' } },
                { title: 'test1', fullText: 'entity', documents: [{ filename: 'file1' }] },
                {
                  index: {
                    _index: elasticIndex,
                    routing: 'id1',
                    _id: 'id1_fullText',
                  },
                },
                {
                  fullText_english: 'this is an english test\fthis is page2',
                  fullText: { name: 'fullText', parent: 'id1' },
                },
                { index: { _index: elasticIndex, _id: 'id2' } },
                { title: 'test2', fullText: 'entity', documents: [{ filename: 'file2' }] },
                {
                  index: {
                    _index: elasticIndex,
                    routing: 'id2',
                    _id: 'id2_fullText',
                  },
                },
                {
                  fullText_other: 'text3[[1]]\ftext4[[2]]',
                  fullText: { name: 'fullText', parent: 'id2' },
                },
              ],
              requestTimeout: 40000,
            });
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('when there is an indexation error', () => {
      it('should log the error with the id of the document and the error message', async () => {
        spyOn(elastic, 'bulk').and.returnValue(
          Promise.resolve({
            items: [{ index: { _id: '_id1', error: 'something terrible happened' } }],
          })
        );
        spyOn(errorLog, 'error');
        const toIndexDocs = [{ _id: 'id1', title: 'test1' }];
        await search.bulkIndex(toIndexDocs, 'index', elasticIndex);

        expect(errorLog.error).toHaveBeenCalledWith(
          'ERROR Failed to index document _id1: "something terrible happened"'
        );
      });
    });
  });

  describe('delete', () => {
    it('should delete the index', done => {
      spyOn(elastic, 'delete').and.returnValue(Promise.resolve());

      const id = db.id();

      const entity = {
        _id: id,
        title: 'Batman indexes',
      };

      search
        .delete(entity)
        .then(() => {
          expect(elastic.delete).toHaveBeenCalledWith({
            index: elasticIndex,
            id: id.toString(),
          });
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('bulkdelete', () => {
    it('should delete documents in a bulk action', done => {
      spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
      const entities = [
        { _id: 'id1', title: 'test1', pdfInfo: 'Should not be included' },
        { _id: 'id2', title: 'test2', pdfInfo: 'Should not be included' },
      ];

      search
        .bulkDelete(entities)
        .then(() => {
          expect(elastic.bulk).toHaveBeenCalledWith({
            body: [
              { delete: { _index: elasticIndex, _id: 'id1' } },
              { delete: { _index: elasticIndex, _id: 'id2' } },
            ],
          });
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('deleteLanguage', () => {
    it('should delete the index', done => {
      spyOn(elastic, 'deleteByQuery').and.returnValue(Promise.resolve());
      search.deleteLanguage('en').then(() => {
        expect(elastic.deleteByQuery).toHaveBeenCalledWith({
          index: elasticIndex,
          body: { query: { match: { language: 'en' } } },
        });
        done();
      });
    });
  });
});
