import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import db from '#api/utils/testing_db.js';
import { documents } from '../documents.js';
import { fixtures, document1 } from './fixtures.js';

describe('documents', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('page', () => {
    it('should return one page without page markers', async () => {
      const page1 = await documents.page(document1.toString(), 1);
      const page2 = await documents.page(document1.toString(), 2);

      expect(page1).toBe('page 1');
      expect(page2).toBe('page 2');
    });

    it('should fail when the document does not exist', async () => {
      await expect(documents.page(db.id().toString(), 1)).rejects.toThrow('document does not exists');
    });
  });

  describe('fullText', () => {
    it('should return concatenated pages without page markers', async () => {
      const text = await documents.fullText(document1.toString());
      expect(text).toBe('page 1\fpage 2');
    });

    it('should fail when the document does not exist', async () => {
      await expect(documents.fullText(db.id().toString())).rejects.toThrow('document does not exists');
    });
  });
});
