/** @format */

import db from 'api/utils/testing_db';
import { search } from '../../search';
import * as helpers from '../helpers';
import model from '../model';
import resultsModel from '../resultsModel';
import fixtures, { fileId, search2Id, template1Id } from './fixtures';

describe('semanticSearch helpers', () => {
  beforeEach(done => {
    db.clearAllAndLoad(fixtures).then(done);
  });
  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('removePageAnnotations', () => {
    it('should remove page number annotations from a piece of text', () => {
      const input = 'this[[1]] is a test[[2]]';
      const output = helpers.removePageAnnotations(input);
      expect(output).toBe('this is a test');
    });
  });

  describe('getSearchDocuments', () => {
    let user;
    let language;
    let args;

    beforeEach(() => {
      user = 'user';
      language = 'en';
      args = {
        documents: [],
        query: {
          limit: 30,
          searchTerm: 'test',
          filters: {},
        },
      };
      jest.spyOn(search, 'search').mockResolvedValue({ rows: [] });
    });

    const getSearchDocs = () => helpers.getSearchDocuments(args, language, user);

    describe('when specific documents are specified is specified', () => {
      it('should return the specified documents', async () => {
        args.documents = ['doc1', 'doc2'];
        const result = await getSearchDocs();
        expect(result).toEqual(['doc1', 'doc2']);
      });
    });

    describe('when documents array is empty', () => {
      it('should call search.search with query and set limit to 9999 and searchTerm to empty', async () => {
        await getSearchDocs();
        expect(search.search).toHaveBeenCalledWith(
          { ...args.query, limit: 9999, searchTerm: '' },
          language,
          user
        );
      });

      it('should return documents from search results', async () => {
        jest.spyOn(search, 'search').mockResolvedValue({
          rows: [
            { sharedId: 'doc1', file: {} },
            { sharedId: 'doc2' },
            { sharedId: 'doc3', file: {} },
          ],
        });
        const res = await getSearchDocs();
        expect(res).toEqual(['doc1', 'doc2', 'doc3']);
      });
    });
  });

  describe('updateSearchDocumentResults', () => {
    it('should update the status of the specified document in the semantic search', async () => {
      await helpers.updateSearchDocumentStatus(search2Id, 'doc2', 'completed');
      const res = await model.db.findOne({ _id: search2Id });
      expect(res.documents.find(doc => doc.sharedId === 'doc2').status).toBe('completed');
    });
  });

  describe('searchSearchDocumentResults', () => {
    const areResultsEqual = (a, b) => a.text === b.text && a.page === b.page && a.score === b.score;

    it('should set the results of the specified document sorted by higher score', async () => {
      const results = [
        { page: '10', text: 't1', score: 0.2 },
        { page: '20', text: 't2', score: 0.6 },
      ];
      const searchId = db.id();
      await helpers.setSearchDocumentResults(searchId, 'doc1', results);
      const res = await resultsModel.db.findOne({ searchId, sharedId: 'doc1' });
      expect(areResultsEqual(res.results[0], results[1])).toBe(true);
      expect(areResultsEqual(res.results[1], results[0])).toBe(true);
      expect(res.averageScore).toBe(0.4);
      expect(res.status).toBe('completed');
    });
  });

  describe('extractDocumentContent', () => {
    let doc;
    beforeEach(() => {
      doc = {
        template: template1Id,
        documents: [
          {
            _id: fileId,
          },
        ],
        metadata: {
          code: [{ value: 'code' }],
          description: [{ value: 'a description' }],
          bio: [{ value: 'a bio' }],
        },
      };
    });

    it('should return content from fullText and rich text fields grouped by page or field name', async () => {
      const contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({
        1: 'page 1',
        2: 'page 2',
        bio: [{ value: 'a bio' }],
        description: [{ value: 'a description' }],
      });
    });

    it('should strip page annotations from fullText content', async () => {
      doc.fullText = { 1: '[[1]]page [[1]]1', 2: 'page[[2]] 2' };
      const contents = await helpers.extractDocumentContent(doc);
      expect(contents['1']).toEqual('page 1');
      expect(contents['2']).toEqual('page 2');
    });

    it('should return metadata results when there is no full text', async () => {
      doc.documents = [{}];
      const contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({
        bio: [{ value: 'a bio' }],
        description: [{ value: 'a description' }],
      });
    });

    it('should return full text results when there is no metadata', async () => {
      delete doc.metadata;
      let contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({
        1: 'page 1',
        2: 'page 2',
      });

      doc.metadata = { code: 'code' };
      contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({
        1: 'page 1',
        2: 'page 2',
      });
    });

    it('should return empty object if there is no full text or rich text fields', async () => {
      delete doc.metadata;
      delete doc.documents;

      const contents = await helpers.extractDocumentContent(doc);
      expect(contents).toEqual({});
    });
  });
});
