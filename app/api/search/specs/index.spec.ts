import db from 'api/utils/testing_db';
import { elasticTesting } from 'api/utils/elastic_testing';
import { search } from '../search';
import { elastic } from '../elastic';
import { fixturesTimeOut } from './fixtures_elastic';

describe('index (search)', () => {
  beforeEach(async () => {
    const elasticIndex = 'index_for_index_testing';
    await db.setupFixturesAndContext({}, elasticIndex);
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
        published: true,
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

      await search.bulkIndex([entity]);
      await elastic.indices.refresh();
      let snippets = await search.searchSnippets('조', entity.sharedId, 'en');

      expect(snippets.fullText.length).toBe(1);
      snippets = await search.searchSnippets('nothing', entity.sharedId, 'en');

      expect(snippets.fullText.length).toBe(0);
    });
  });

  describe('bulkIndex', () => {
    it('should update docs using the bulk functionality', async () => {
      const toIndexDocs = [
        { _id: 'id1', title: 'test1' },
        { _id: 'id2', title: 'test2' },
      ];

      await search.bulkIndex(toIndexDocs);
      await elastic.indices.refresh();

      expect(await elasticTesting.getIndexedEntities()).toEqual([
        {
          documents: [],
          title: 'test1',
          fullText: 'entity',
        },
        {
          documents: [],
          title: 'test2',
          fullText: 'entity',
        },
      ]);
    });

    describe('when docs have fullText', () => {
      it('should be indexed separatedly as a child of the doc', async () => {
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

        await search.bulkIndex(toIndexDocs);
        await elastic.indices.refresh();

        expect(await elasticTesting.getIndexedEntities('')).toEqual([
          expect.objectContaining({ title: 'test1' }),
          expect.objectContaining({ fullText: { name: 'fullText', parent: 'id1' } }),
          expect.objectContaining({ title: 'test2' }),
          expect.objectContaining({ fullText: { name: 'fullText', parent: 'id2' } }),
        ]);
      });
    });

    describe('when there is an indexation error', () => {
      describe('if elastic fails indexing one or more items', () => {
        beforeEach(() => {
          jest.resetAllMocks();
          jest.spyOn(elastic, 'bulk').mockReturnValue(
            // @ts-ignore
            Promise.resolve({
              body: {
                items: [
                  { index: { _id: 'id1', error: { message: 'indexation error 1' } } },
                  { index: { _id: 'id2' } },
                  { index: { _id: 'id3', error: { message: 'indexation error 2' } } },
                ],
              },
            })
          );
        });

        it('should throw the error with the relevant information', async () => {
          const toIndexDocs = [{ _id: 'id1', title: 'test1' }];
          try {
            await search.bulkIndex(toIndexDocs, 'index');
            fail('should throw an indexing error');
          } catch (error) {
            expect(error.message.match('ERROR! Failed to index documents.')).toBeTruthy();
            expect(error.errors).toEqual([
              { index: { _id: 'id1', error: { message: 'indexation error 1' } } },
              { index: { _id: 'id3', error: { message: 'indexation error 2' } } },
            ]);
          }
        });
      });
    });
  });

  describe('delete', () => {
    beforeAll(() => {
      jest.restoreAllMocks();
    });

    it('should delete the index', async () => {
      const entity = {
        _id: 'id',
        title: 'Batman indexes',
      };

      const toIndexDocs = [entity];
      await search.bulkIndex(toIndexDocs);
      await elastic.indices.refresh();
      await search.delete(entity);
      await elastic.indices.refresh();

      expect(await elasticTesting.getIndexedEntities()).toEqual([]);
    });
  });

  describe('bulkdelete', () => {
    it('should delete documents in a bulk action', async () => {
      const toIndexDocs = [
        { _id: 'id1', title: 'test1' },
        { _id: 'id2', title: 'test2' },
      ];

      await search.bulkIndex(toIndexDocs);
      await elastic.indices.refresh();
      await search.bulkDelete(toIndexDocs);
      await elastic.indices.refresh();

      expect(await elasticTesting.getIndexedEntities()).toEqual([]);
    });
  });

  describe('deleteLanguage', () => {
    it('should delete the index', async () => {
      const toIndexDocs = [
        { _id: 'id1', title: 'test1', language: 'en' },
        { _id: 'id2', title: 'test2', language: 'en' },
        { _id: 'id3', title: 'test3', language: 'es' },
        { _id: 'id4', title: 'test4', language: 'es' },
      ];

      await search.bulkIndex(toIndexDocs);
      await elastic.indices.refresh();
      await search.deleteLanguage('en');
      await elastic.indices.refresh();

      expect(await elasticTesting.getIndexedEntities()).toEqual([
        expect.objectContaining({ language: 'es' }),
        expect.objectContaining({ language: 'es' }),
      ]);
    });
  });
});
