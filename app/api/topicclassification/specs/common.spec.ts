import templates from 'api/templates';
import { extractSequence } from 'api/topicclassification';
import db from 'api/utils/testing_db';
import { buildFullModelName, getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from '../../../shared/types/templateType';
import fixtures, { moviesId, template1 } from './fixtures';

describe('templates utils', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('buildModelName', () => {
    process.env.DATABASE_NAME = 'test-db';
    expect(buildFullModelName('Abc-D e(F)g')).toBe('test-db-abcdefg');
  });

  describe('getThesaurusPropertyNames', () => {
    it('should work with fixtues', async () => {
      expect(getThesaurusPropertyNames(moviesId.toString(), await templates.get(null))).toEqual([
        'movies',
      ]);
    });

    it('should work complex examples', () => {
      const tmpl1: TemplateSchema = {
        name: 'tmpl1',
        commonProperties: [{ label: 'Title', name: 'title', type: 'text' }],
        properties: [{ label: 'A', name: 'a', type: 'select', content: 'abc' }],
      };
      const tmpl2: TemplateSchema = {
        name: 'tmpl2',
        commonProperties: [{ label: 'Title', name: 'title', type: 'text' }],
        properties: [
          { label: 'A', name: 'a', type: 'select', content: 'abc' },
          { label: 'B', name: 'b', type: 'multiselect', content: 'def' },
          { label: 'C', name: 'c', type: 'multiselect', content: 'abc' },
        ],
      };
      expect(getThesaurusPropertyNames('abc', [tmpl1])).toEqual(['a']);
      expect(getThesaurusPropertyNames('abc', [tmpl1, tmpl2])).toEqual(['a', 'c']);
    });
  });

  describe('extractSequence', () => {
    it('should ignore non-text fields, no title', async () => {
      const entity: EntitySchema = { template: template1 };
      const result = await extractSequence(entity);
      expect(result).toBe('');
    });
    it('should ignore non-text fields, with title', async () => {
      const entity: EntitySchema = { template: template1, title: 'hello' };
      const result = await extractSequence(entity);
      expect(result).toBe('hello');
    });
    it('should ignore non-text fields, with title', async () => {
      const entity: EntitySchema = {
        template: template1,
        title: 'hello',
        metadata: { date: [{ value: 10 }] },
      };
      const result = await extractSequence(entity);
      expect(result).toBe('hello');
    });
    it('should ignore non-single fields', async () => {
      const entity: EntitySchema = {
        template: template1,
        title: 'hello',
        metadata: { date: [{ value: 10 }], text: [] },
      };
      const result = await extractSequence(entity);
      expect(result).toBe('hello');
    });
    it('should use text fields', async () => {
      const entity: EntitySchema = {
        template: template1,
        title: 'hello',
        metadata: { date: [{ value: 10 }], text: [{ value: 'world' }] },
      };
      const result = await extractSequence(entity);
      expect(result).toBe('hello world');
    });
  });
});
