/* eslint-disable max-lines */
import moment from 'moment-timezone';
import {
  formatters as typeFormatters,
  formatFile,
  formatDate,
  formatAttachment,
  FormatterFunction,
  formatDocuments,
  formatAttachments,
} from '../typeFormatters';

let formatFn: any;
let unixFn: any;

const formatDateFn = () => {
  let sec = 0;
  const next = () => {
    sec += 1;
    return `${sec}`;
  };
  return next;
};

const mockMoment = () => {
  formatFn = jest.fn(formatDateFn());
  unixFn = jest.fn(() => ({
    utc: () => ({
      format: formatFn,
    }),
  }));
  moment.unix = unixFn;
};

const originalMomentUnix = moment.unix;
afterAll(() => {
  moment.unix = originalMomentUnix;
});

beforeEach(() => {
  mockMoment();
});

afterEach(() => {
  jest.clearAllMocks();
});

const testEmptyField = (formatter: FormatterFunction) => {
  const field: any[] = [];
  const value = formatter(field, {});
  expect(value).toBe('');

  const nullField: any[] = [
    {
      value: null,
    },
  ];
  const nullValue = formatter(nullField, {});
  expect(nullValue).toBe('');
};

const testSimple = (value: any, formatter: FormatterFunction, expected: any) => {
  const field = [{ value }];
  const result = formatter(field, {});
  expect(result).toBe(expected);
  testEmptyField(formatter);
};

describe('csvExporter typeFormatters', () => {
  describe('SELECTS', () => {
    it('should return the correct SELECT value', () => {
      const field = [{ label: 'label1', value: 'value1' }];
      const value = typeFormatters.select(field, {});
      expect(value).toBe('label1');
      testEmptyField(typeFormatters.select);
    });

    it('should return the correct MULTISELECT value', () => {
      const singleField = [{ label: 'label1', value: 'value1' }];
      const multipleField = [
        { label: 'label1', value: 'value1' },
        { label: 'label2', value: 'value2' },
      ];

      const singleValue = typeFormatters.multiselect(singleField, {});
      const multipleValue = typeFormatters.multiselect(multipleField, {});

      expect(singleValue).toBe('label1');
      expect(multipleValue).toBe('label1|label2');
      testEmptyField(typeFormatters.multiselect);
    });
  });

  describe('DATES', () => {
    it('should return the correct DATE value', () => {
      const field = [{ value: 1585851003 }];

      const value = typeFormatters.date(field, {});

      expect(value).toBe('1');
      expect(moment.unix).toHaveBeenLastCalledWith(1585851003);
      expect(formatFn).toHaveBeenLastCalledWith('YYYY-MM-DD');

      testEmptyField(typeFormatters.date);
    });

    it('should return the correct MULTIDATE value', () => {
      const multipleField = [{ value: 1585851003 }, { value: 1585915200 }];

      const multipleValue = typeFormatters.multidate(multipleField, {});

      expect(multipleValue).toBe('1|2');
      expect(unixFn).toHaveBeenCalledTimes(2);
      expect(formatFn).toHaveBeenCalledTimes(2);

      testEmptyField(typeFormatters.multidate);
    });

    it('should return the correct DATERANGE value', () => {
      const field = [{ value: { from: 1585851003, to: 1585915200 } }];

      const value = typeFormatters.daterange(field, {});

      expect(value).toBe('1~2');
      expect(moment.unix).toHaveBeenCalledTimes(2);
      expect(formatFn).toHaveBeenCalledTimes(2);

      testEmptyField(typeFormatters.daterange);
    });

    it('should return the correct MULTIDATERANGE value', () => {
      const multipleField = [
        { value: { from: 1585851003, to: 1585915200 } },
        { value: { from: 1585851003, to: 1585915200 } },
      ];

      const multipleValue = typeFormatters.multidaterange(multipleField, {});

      expect(multipleValue).toBe('1~2|3~4');
      expect(unixFn).toHaveBeenCalledTimes(4);
      expect(formatFn).toHaveBeenCalledTimes(4);

      testEmptyField(typeFormatters.multidaterange);
    });
  });

  describe('URLs', () => {
    it('should return the correct LINK value', () => {
      testSimple({ label: 'UWAZI', url: 'uwazi.io' }, typeFormatters.link, 'UWAZI|uwazi.io');
    });
  });

  describe('default formatter', () => {
    it.each(['image.jpg', 'text', 'markdown', 'media_url'])(
      'should return a plain value for fields without a special format like %s',
      fieldValue => {
        testSimple(fieldValue, typeFormatters.default, fieldValue);
      }
    );
  });

  describe('SIMPLE', () => {
    it('should return the correct NUMERIC value', () => {
      testSimple(1234, typeFormatters.numeric, 1234);
      testSimple(0, typeFormatters.numeric, 0);
    });
  });

  describe('GEOLOCATION', () => {
    it('should return the correct GEOLOCATION value', () => {
      testSimple(
        { lat: '46.2050242', lon: '6.1090692' },
        typeFormatters.geolocation,
        '46.2050242|6.1090692'
      );
    });
  });

  describe('RELATIONSHIP', () => {
    it('should return the entity label when has no inherited value', () => {
      const singleField = [{ label: 'Entity 1', value: null }];
      const multipleField = [
        { label: 'Entity 1', value: null },
        { label: 'Entity 2', value: null },
      ];

      const singleValue = typeFormatters.relationship(singleField, {});
      const multipleValue = typeFormatters.relationship(multipleField, {});

      expect(singleValue).toBe('Entity 1');
      expect(multipleValue).toBe('Entity 1|Entity 2');
      testEmptyField(typeFormatters.relationship);
    });

    it('should return the inherited entity value when has inherited value', () => {
      const singleField = [
        {
          label: 'Entity 1',
          value: null,
          inheritedValue: [{ value: 'E1' }],
          inheritedType: 'text',
        },
      ];
      const multipleField = [
        {
          label: 'Entity 1',
          value: null,
          inheritedValue: [{ value: 'E1' }],
          inheritedType: 'text',
        },
        {
          label: 'Entity 2',
          value: null,
          inheritedValue: [{ value: 'E2' }],
          inheritedType: 'text',
        },
      ];

      const singleValue = typeFormatters.relationship(singleField, {});
      const multipleValue = typeFormatters.relationship(multipleField, {});

      expect(singleValue).toBe('E1');
      expect(multipleValue).toBe('E1|E2');
      testEmptyField(typeFormatters.relationship);
    });

    it('should return the entity label when inherited value is not defined', () => {
      const singleField = [
        {
          label: 'Entity 1',
          value: null,
          inheritedValue: [],
          inheritedType: 'text',
        },
      ];
      const multipleField = [
        {
          label: 'Entity 1',
          value: null,
          inheritedValue: [{ value: 'E1' }],
          inheritedType: 'text',
        },
        {
          label: 'Entity 2',
          value: null,
          inheritedValue: [],
          inheritedType: 'text',
        },
      ];

      const singleValue = typeFormatters.relationship(singleField, {});
      const multipleValue = typeFormatters.relationship(multipleField, {});

      expect(singleValue).toBe('Entity 1');
      expect(multipleValue).toBe('E1|Entity 2');
      testEmptyField(typeFormatters.relationship);
    });
  });

  describe('FILES', () => {
    it('should return the correct DOCUMENTS value', () => {
      const singleField = [{ filename: 'file1.pdf', value: null }];
      const multipleField = [
        { filename: 'file1.pdf', value: null },
        { filename: 'file2.pdf', value: null },
      ];

      const singleValue = formatDocuments({ documents: singleField });
      const multipleValue = formatDocuments({ documents: multipleField });
      const emptyValue = formatDocuments({ documents: [] });

      expect(singleValue).toBe(formatFile('file1.pdf'));
      expect(multipleValue).toBe(`${formatFile('file1.pdf')}|${formatFile('file2.pdf')}`);
      expect(emptyValue).toBe('');
    });

    it('should return the correct ATTACHMENTS value', () => {
      const singleField = [{ filename: 'file1.pdf', entityId: 'entity1', value: null }];
      const multipleField = [
        { filename: 'file1.pdf', entityId: 'entity1', value: null },
        { filename: 'file2.pdf', entityId: 'entity1', value: null },
      ];

      const singleValue = formatAttachments(
        { attachments: singleField, _id: 'entity1' },
        'cejil.uwazi.io'
      );
      const multipleValue = formatAttachments(
        { attachments: multipleField, _id: 'entity1' },
        'cejil.uwazi.io'
      );
      const emptyValue = formatDocuments({ attachments: [], _id: 'entity1' });

      expect(singleValue).toBe('https://cejil.uwazi.io/api/files/file1.pdf');
      expect(multipleValue).toBe(
        'https://cejil.uwazi.io/api/files/file1.pdf|https://cejil.uwazi.io/api/files/file2.pdf'
      );
      expect(emptyValue).toBe('');
    });
  });

  describe('HELPERS', () => {
    it('should format timestamps to the provided format, mapped to momentjs', () => {
      const timestamp = 1585851003;

      const formatted1 = formatDate(timestamp, 'yyyy/MM/dd');

      expect(unixFn).toHaveBeenCalledWith(timestamp);
      expect(formatFn).toHaveBeenCalledWith('YYYY/MM/DD');
      expect(formatted1).toBe('1');
    });

    it('should build the correct document url', () => {
      const fileName = 'fileName.pdf';

      const url = formatFile(fileName);

      expect(url).toBe('/files/fileName.pdf');
    });

    it('should build the correct attachment url', () => {
      const fileName = 'fileName.pdf';
      const hostname = 'cejil.uwazi.io';

      const url = formatAttachment(fileName, hostname);

      expect(url).toBe('https://cejil.uwazi.io/api/files/fileName.pdf');
    });
  });
});
