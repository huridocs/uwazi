import moment from 'moment';
import typeParsers from '../typeParsers';

describe('csvLoader typeParsers', () => {
  describe('text', () => {
    it('should return the value', async () => {
      const templateProp = { name: 'text_prop' };
      const rawEntity = { text_prop: 'text' };

      expect(await typeParsers.text(rawEntity, templateProp)).toEqual([{ value: 'text' }]);
    });
  });

  describe('numeric', () => {
    it('should return numeric value', async () => {
      const templateProp = { name: 'numeric_prop' };
      const rawEntity = { numeric_prop: '2019' };

      expect(await typeParsers.numeric(rawEntity, templateProp)).toEqual([{ value: 2019 }]);
    });

    it('should return original value if value is NaN (will be catched by the entitiy validator)', async () => {
      const templateProp = { name: 'numeric_prop' };
      const rawEntity = { numeric_prop: 'Not a number' };

      expect(await typeParsers.numeric(rawEntity, templateProp)).toEqual([
        { value: 'Not a number' },
      ]);
    });
  });

  describe('link', () => {
    it('should use the text as url and label', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'http://www.url.com' };

      expect(await typeParsers.link(rawEntity, templateProp)).toEqual([
        {
          value: {
            label: 'http://www.url.com',
            url: 'http://www.url.com',
          },
        },
      ]);
    });

    it('should return null if url is not valid', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'url' };

      expect(await typeParsers.link(rawEntity, templateProp)).toBe(null);
    });

    it('should use "|" as separator for label and url', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = { link_prop: 'label|http://www.url.com' };

      expect(await typeParsers.link(rawEntity, templateProp)).toEqual([
        {
          value: {
            label: 'label',
            url: 'http://www.url.com',
          },
        },
      ]);
    });
  });

  describe('date', () => {
    it('should parse date and return a timestamp', async () => {
      const templateProp = { name: 'date_prop' };

      let expected = await typeParsers.date({ date_prop: '2014' }, templateProp);
      expect(moment.utc(expected[0].value, 'X').format('DD-MM-YYYY')).toEqual('01-01-2014');

      expected = await typeParsers.date({ date_prop: '2014 11 6' }, templateProp);
      expect(moment.utc(expected[0].value, 'X').format('DD-MM-YYYY')).toEqual('06-11-2014');

      expected = await typeParsers.date({ date_prop: '1/1/1996 00:00:00' }, templateProp);
      expect(moment.utc(expected[0].value, 'X').format('DD-MM-YYYY')).toEqual('01-01-1996');

      expected = await typeParsers.date({ date_prop: '1/1/1996 23:59:59' }, templateProp);
      expect(moment.utc(expected[0].value, 'X').format('DD-MM-YYYY')).toEqual('01-01-1996');
    });
  });
});
