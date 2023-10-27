import moment from 'moment';
import typeParsers from '../typeParsers';

const rawEntityWithProps = props => ({
  propertiesFromColumns: props,
});

describe('csvLoader typeParsers', () => {
  describe('text', () => {
    it('should return the value', async () => {
      const templateProp = { name: 'text_prop' };
      const rawEntity = rawEntityWithProps({ text_prop: 'text' });

      expect(await typeParsers.text(rawEntity, templateProp)).toEqual([{ value: 'text' }]);
    });
  });

  describe('numeric', () => {
    it('should return numeric value', async () => {
      const templateProp = { name: 'numeric_prop' };
      const rawEntity = rawEntityWithProps({ numeric_prop: '2019' });

      expect(await typeParsers.numeric(rawEntity, templateProp)).toEqual([{ value: 2019 }]);
    });

    it('should return original value if value is NaN (will be catched by the entitiy validator)', async () => {
      const templateProp = { name: 'numeric_prop' };
      const rawEntity = rawEntityWithProps({ numeric_prop: 'Not a number' });

      expect(await typeParsers.numeric(rawEntity, templateProp)).toEqual([
        { value: 'Not a number' },
      ]);
    });
  });

  describe('link', () => {
    it('should use the text as url and label', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = rawEntityWithProps({ link_prop: 'http://www.url.com' });

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
      const rawEntity = rawEntityWithProps({ link_prop: 'url' });

      expect(await typeParsers.link(rawEntity, templateProp)).toBe(null);
    });

    it('should use "|" as separator for label and url', async () => {
      const templateProp = { name: 'link_prop' };
      const rawEntity = rawEntityWithProps({ link_prop: 'label|http://www.url.com' });

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
    it.each`
      dateProp               | dateFormat      | expectedDate
      ${'2014'}              | ${'dd/MM/yyyy'} | ${'01-01-2014'}
      ${'2014'}              | ${'MM/dd/yyyy'} | ${'01-01-2014'}
      ${'2014'}              | ${'yyyy/MM/dd'} | ${'01-01-2014'}
      ${'2014'}              | ${'dd-MM-yyyy'} | ${'01-01-2014'}
      ${'2014'}              | ${'MM-dd-yyyy'} | ${'01-01-2014'}
      ${'2014'}              | ${'yyyy-MM-dd'} | ${'01-01-2014'}
      ${'2014 11 6'}         | ${'dd/MM/yyyy'} | ${'06-11-2014'}
      ${'2014 11 6'}         | ${'MM/dd/yyyy'} | ${'06-11-2014'}
      ${'2014 11 6'}         | ${'yyyy/MM/dd'} | ${'06-11-2014'}
      ${'2014 11 6'}         | ${'dd-MM-yyyy'} | ${'06-11-2014'}
      ${'2014 11 6'}         | ${'MM-dd-yyyy'} | ${'06-11-2014'}
      ${'2014 11 6'}         | ${'yyyy-MM-dd'} | ${'06-11-2014'}
      ${'December 17, 1995'} | ${'dd/MM/yyyy'} | ${'17-12-1995'}
      ${'December 17, 1995'} | ${'MM/dd/yyyy'} | ${'17-12-1995'}
      ${'December 17, 1995'} | ${'yyyy/MM/dd'} | ${'17-12-1995'}
      ${'December 17, 1995'} | ${'dd-MM-yyyy'} | ${'17-12-1995'}
      ${'December 17, 1995'} | ${'MM-dd-yyyy'} | ${'17-12-1995'}
      ${'December 17, 1995'} | ${'yyyy-MM-dd'} | ${'17-12-1995'}
      ${'12/01/2021'}        | ${'dd/MM/yyyy'} | ${'12-01-2021'}
      ${'12/01/2021'}        | ${'MM/dd/yyyy'} | ${'01-12-2021'}
      ${'2021/12/01'}        | ${'yyyy/MM/dd'} | ${'01-12-2021'}
      ${'12/01/2021'}        | ${'dd-MM-yyyy'} | ${'12-01-2021'}
      ${'12/01/2021'}        | ${'MM-dd-yyyy'} | ${'01-12-2021'}
      ${'2021/12/01'}        | ${'yyyy-MM-dd'} | ${'01-12-2021'}
      ${'12-01-2021'}        | ${'dd/MM/yyyy'} | ${'12-01-2021'}
      ${'12-01-2021'}        | ${'MM/dd/yyyy'} | ${'01-12-2021'}
      ${'2021-12-01'}        | ${'yyyy/MM/dd'} | ${'01-12-2021'}
      ${'12-01-2021'}        | ${'dd-MM-yyyy'} | ${'12-01-2021'}
      ${'12-01-2021'}        | ${'MM-dd-yyyy'} | ${'01-12-2021'}
      ${'2021-12-01'}        | ${'yyyy-MM-dd'} | ${'01-12-2021'}
    `(
      "should parse '$dateProp' with format '$dateFormat' and return a timestamp",
      async ({ dateProp, dateFormat, expectedDate }) => {
        const templateProp = { name: 'date_prop' };

        const expected = await typeParsers.date(
          rawEntityWithProps({ date_prop: dateProp }),
          templateProp,
          dateFormat
        );

        expect(moment.utc(expected[0].value, 'X').format('DD-MM-YYYY')).toEqual(expectedDate);
      }
    );
  });

  describe('multidate', () => {
    it.each`
      dateProp                                 | dateFormat      | expectedDate
      ${'2014|2015'}                           | ${'dd/MM/yyyy'} | ${['01-01-2014', '01-01-2015']}
      ${'2014 11 6|2015 11 6'}                 | ${'dd/MM/yyyy'} | ${['06-11-2014', '06-11-2015']}
      ${'December 17, 1995|December 17, 1996'} | ${'dd/MM/yyyy'} | ${['17-12-1995', '17-12-1996']}
      ${'12/01/2021|12/01/2022'}               | ${'dd/MM/yyyy'} | ${['12-01-2021', '12-01-2022']}
      ${'2021/12/01|2022/12/01'}               | ${'yyyy/MM/dd'} | ${['01-12-2021', '01-12-2022']}
      ${'2021|'}                               | ${'yyyy/MM/dd'} | ${['01-01-2021']}
      ${'2021||2022'}                          | ${'yyyy/MM/dd'} | ${['01-01-2021', '01-01-2022']}
      ${'|'}                                   | ${'yyyy/MM/dd'} | ${[]}
      ${''}                                    | ${'yyyy/MM/dd'} | ${[]}
    `(
      "should parse '$dateProp' with format '$dateFormat' and return a timestamp",
      async ({ dateProp, dateFormat, expectedDate }) => {
        const templateProp = { name: 'date_prop' };

        const expected = await typeParsers.multidate(
          rawEntityWithProps({ date_prop: dateProp }),
          templateProp,
          dateFormat
        );

        expect(expected.map(date => moment.utc(date.value, 'X').format('DD-MM-YYYY'))).toEqual(
          expectedDate
        );
      }
    );
  });

  describe('daterange', () => {
    it.each`
      dateProp                                 | dateFormat      | expectedDate
      ${'2014:2015'}                           | ${'dd/MM/yyyy'} | ${{ from: '01-01-2014', to: '01-01-2015' }}
      ${'2014 11 6:2015 11 6'}                 | ${'dd/MM/yyyy'} | ${{ from: '06-11-2014', to: '06-11-2015' }}
      ${'December 17, 1995:December 17, 1996'} | ${'dd/MM/yyyy'} | ${{ from: '17-12-1995', to: '17-12-1996' }}
      ${'12/01/2021:12/01/2022'}               | ${'dd/MM/yyyy'} | ${{ from: '12-01-2021', to: '12-01-2022' }}
      ${'2021/12/01:2022/12/01'}               | ${'yyyy/MM/dd'} | ${{ from: '01-12-2021', to: '01-12-2022' }}
      ${'2021/12/01:'}                         | ${'yyyy/MM/dd'} | ${{ from: '01-12-2021', to: null }}
      ${':2021/12/01'}                         | ${'yyyy/MM/dd'} | ${{ from: null, to: '01-12-2021' }}
    `(
      "should parse '$dateProp' with format '$dateFormat' and return the to and from timestamps",
      async ({ dateProp, dateFormat, expectedDate }) => {
        const templateProp = { name: 'date_prop' };

        const [
          {
            value: { from, to },
          },
        ] = await typeParsers.daterange(
          rawEntityWithProps({ date_prop: dateProp }),
          templateProp,
          dateFormat
        );

        expect({
          from: from && moment.utc(from, 'X').format('DD-MM-YYYY'),
          to: to && moment.utc(to, 'X').format('DD-MM-YYYY'),
        }).toEqual(expectedDate);
      }
    );
  });

  describe('multidaterange', () => {
    it.each([
      {
        dateProp: '2014:2015|2016:2017',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [
          { from: '01-01-2014', to: '01-01-2015' },
          { from: '01-01-2016', to: '01-01-2017' },
        ],
      },
      {
        dateProp: '2014 11 6:2015 11 6|2016 11 6:2017 11 6',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [
          { from: '06-11-2014', to: '06-11-2015' },
          { from: '06-11-2016', to: '06-11-2017' },
        ],
      },
      {
        dateProp: 'December 17, 1995:December 17, 1996|December 17, 1997:December 17, 1998',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [
          { from: '17-12-1995', to: '17-12-1996' },
          { from: '17-12-1997', to: '17-12-1998' },
        ],
      },
      {
        dateProp: '12/01/2021:12/01/2022|12/01/2023:12/01/2024',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [
          { from: '12-01-2021', to: '12-01-2022' },
          { from: '12-01-2023', to: '12-01-2024' },
        ],
      },
      {
        dateProp: '2021/12/01:2022/12/01|2023/12/01:2024/12/01',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [
          { from: '01-12-2021', to: '01-12-2022' },
          { from: '01-12-2023', to: '01-12-2024' },
        ],
      },
      {
        dateProp: '2021/12/01:2022/12/01|',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [{ from: '01-12-2021', to: '01-12-2022' }],
      },
      {
        dateProp: '2021/12/01:2022/12/01||2023/12/01:2024/12/01',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [
          { from: '01-12-2021', to: '01-12-2022' },
          { from: '01-12-2023', to: '01-12-2024' },
        ],
      },
      {
        dateProp: '|',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [],
      },
      {
        dateProp: '',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [],
      },
      {
        dateProp: '2021/12/01:|:2024/12/01',
        dateFormat: 'dd/MM/yyyy',
        expectedDate: [
          { from: '01-12-2021', to: null },
          { from: null, to: '01-12-2024' },
        ],
      },
    ])(
      "should parse '$dateProp' with format '$dateFormat' and return an array of to and from timestamps",
      async ({ dateProp, dateFormat, expectedDate }) => {
        const templateProp = { name: 'date_prop' };

        const expected = await typeParsers.multidaterange(
          rawEntityWithProps({ date_prop: dateProp }),
          templateProp,
          dateFormat
        );

        expect(
          expected.map(range => ({
            from: range.value.from && moment.utc(range.value.from, 'X').format('DD-MM-YYYY'),
            to: range.value.to && moment.utc(range.value.to, 'X').format('DD-MM-YYYY'),
          }))
        ).toEqual(expectedDate);
      }
    );
  });
});
