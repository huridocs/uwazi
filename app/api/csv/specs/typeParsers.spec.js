import moment from 'moment';

import entities from 'api/entities';
import thesauris from 'api/thesauris';
import db from 'api/utils/testing_db';

import fixtures, { thesauri1Id, templateToRelateId } from './fixtures';
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
      let rawEntity = { date_prop: '2014' };

      let expected = await typeParsers.date(rawEntity, templateProp);
      expect(moment.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('01-01-2014');

      rawEntity = { date_prop: '2014 11 6' };

      expected = await typeParsers.date(rawEntity, templateProp);

      rawEntity = { date_prop: '1/1/1996 00:00:00' };

      expected = await typeParsers.date(rawEntity, templateProp);
      expect(moment.utc(expected, 'X').format('DD-MM-YYYY')).toEqual('01-01-1996');
    });
  });

  describe('select', () => {
    it('should create thesauri value and return the id', async () => {
      const templateProp = { name: 'select_prop', content: thesauri1Id };

      const value1 = await typeParsers.select({ select_prop: 'value' }, templateProp);
      const value2 = await typeParsers.select({ select_prop: 'value2' }, templateProp);
      const thesauri1 = await thesauris.getById(thesauri1Id);

      expect(thesauri1.values[1].label).toBe('value');
      expect(thesauri1.values[2].label).toBe('value2');
      expect(value1).toBe(thesauri1.values[1].id);
      expect(value2).toBe(thesauri1.values[2].id);
    });

    it('should not create repeated values', async () => {
      const templateProp = { name: 'select_prop', content: thesauri1Id };

      await typeParsers.select({ select_prop: 'value4' }, templateProp);
      await typeParsers.select({ select_prop: 'value ' }, templateProp);
      await typeParsers.select({ select_prop: 'value' }, templateProp);
      await typeParsers.select({ select_prop: ' value ' }, templateProp);
      await typeParsers.select({ select_prop: 'value4' }, templateProp);
      const thesauri1 = await thesauris.getById(thesauri1Id);

      expect(thesauri1.values.length).toBe(2);
    });

    it('should not create blank values', async () => {
      const templateProp = { name: 'select_prop', content: thesauri1Id };
      const rawEntity = { select_prop: ' ' };

      const value = await typeParsers.select(rawEntity, templateProp);
      const thesauri1 = await thesauris.getById(thesauri1Id);

      expect(thesauri1.values.length).toBe(1);
      expect(value).toBe(null);
    });
  });

  describe('multiselect', () => {
    let value1;
    let value2;
    let value3;
    let value4;
    let thesauri1;

    const templateProp = { name: 'multiselect_prop', content: thesauri1Id };

    beforeAll(async () => {
      value1 = await typeParsers.multiselect(
        { multiselect_prop: 'value4' },
        templateProp
      );

      value2 = await typeParsers.multiselect(
        { multiselect_prop: 'value1|value3| value3' },
        templateProp
      );

      value3 = await typeParsers.multiselect(
        { multiselect_prop: 'value1| value2' },
        templateProp
      );

      value4 = await typeParsers.multiselect(
        { multiselect_prop: 'value1|value2' },
        templateProp
      );

      await typeParsers.multiselect(
        { multiselect_prop: '' },
        templateProp
      );

      await typeParsers.multiselect(
        { multiselect_prop: '|' },
        templateProp
      );

      thesauri1 = await thesauris.getById(thesauri1Id);
    });

    it('should create thesauri values and return an array of ids', async () => {
      expect(thesauri1.values[0].label).toBe(' value4 ');
      expect(thesauri1.values[1].label).toBe('value1');
      expect(thesauri1.values[2].label).toBe('value3');
      expect(thesauri1.values[3].label).toBe('value2');

      expect(value1).toEqual([thesauri1.values[0].id]);
      expect(value2).toEqual([thesauri1.values[1].id, thesauri1.values[2].id]);
      expect(value3).toEqual([thesauri1.values[1].id, thesauri1.values[3].id]);
      expect(value4).toEqual([thesauri1.values[1].id, thesauri1.values[3].id]);
    });

    it('should not create blank values, or repeat values', async () => {
      expect(thesauri1.values.length).toBe(4);
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

      await entities.save(
        { title: '   value1  ', template: templateToRelateId },
        { user: {}, language: 'en' }
      );
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

      entitiesRelated = await entities.get({ template: templateToRelateId });
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
