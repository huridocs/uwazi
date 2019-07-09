import moment from 'moment';

import entities, { model } from 'api/entities';
import db from 'api/utils/testing_db';

import fixtures, { templateToRelateId } from './fixtures';
import typeParsers from '../typeParsers';

describe('csvLoader typeParsers', () => {
  beforeEach(async () => db.clearAllAndLoad(fixtures));
  afterAll(async () => db.disconnect());

  describe('default', () => {
    it('should use text parser', async () => {
      const templateProp = { name: 'text_prop' };
      const rawEntity = { text_prop: 'text' };

      expect(await typeParsers.default(rawEntity, templateProp)).toBe('text');
    });
  });

  describe('text', () => {
    it('should return the value', async () => {
      const templateProp = { name: 'text_prop' };
      const rawEntity = { text_prop: 'text' };

      expect(await typeParsers.text(rawEntity, templateProp)).toBe('text');
    });
  });

  describe('link', () => {
    it('should use the text as url and label', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'http://www.url.com' };

      expect(await typeParsers.link(rawEntity, templateProp)).toEqual({
        label: 'http://www.url.com',
        url: 'http://www.url.com',
      });
    });

    it('should return null if url is not valid', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'url' };

      expect(await typeParsers.link(rawEntity, templateProp)).toBe(null);
    });

    it('should use "|" as separator for label and url', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'label|http://www.url.com' };

      expect(await typeParsers.link(rawEntity, templateProp)).toEqual({
        label: 'label',
        url: 'http://www.url.com',
      });
    });
  });

  describe('date', () => {
    it('should parse date and return a timestamp', async () => {
      const templateProp = { name: 'date_prop' };

      let expected = await typeParsers.date({ date_prop: '2014' }, templateProp);
      expect(moment.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('01-01-2014');

      expected = await typeParsers.date({ date_prop: '2014 11 6' }, templateProp);
      expect(moment.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('06-11-2014');

      expected = await typeParsers.date({ date_prop: '1/1/1996 00:00:00' }, templateProp);
      expect(moment.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('01-01-1996');

      expected = await typeParsers.date({ date_prop: '1/1/1996 23:59:59' }, templateProp);
      expect(moment.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('01-01-1996');
    });
  });

  describe('relationship', () => {
    let value1;
    let value2;
    let value3;
    let entitiesRelated;

    const templateProp = {
      name: 'relationship_prop',
      content: templateToRelateId
    };

    beforeAll(async () => {
      spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());

      await model.save({ title: '   value1  ', template: templateToRelateId, sharedId: '123', language: 'en' });
      await model.save({ title: '   value1  ', template: templateToRelateId, sharedId: '123', language: 'es' });
      value1 = await typeParsers.relationship(
        { relationship_prop: 'value1|value3| value3' },
        templateProp
      );

      value2 = await typeParsers.relationship(
        { relationship_prop: 'value1| value2' },
        templateProp
      );

      value3 = await typeParsers.relationship(
        { relationship_prop: 'value1|value2' },
        templateProp
      );

      await typeParsers.relationship(
        { relationship_prop: '' },
        templateProp
      );

      await typeParsers.relationship(
        { relationship_prop: '|' },
        templateProp
      );

      entitiesRelated = await entities.get({ template: templateToRelateId, language: 'en' });
    });

    it('should create entities and return the ids', async () => {
      expect(entitiesRelated[0].title).toBe('   value1  ');
      expect(entitiesRelated[1].title).toBe('value3');
      expect(entitiesRelated[2].title).toBe('value2');

      expect(value1).toEqual([entitiesRelated[0].sharedId, entitiesRelated[1].sharedId]);
      expect(value2).toEqual([entitiesRelated[0].sharedId, entitiesRelated[2].sharedId]);
      expect(value3).toEqual([entitiesRelated[0].sharedId, entitiesRelated[2].sharedId]);
    });

    it('should not create blank values or duplicate values', async () => {
      expect(entitiesRelated.length).toBe(3);
    });
  });
});
