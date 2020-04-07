import moment from 'moment';
import typeFormatters, {
  formatFile,
  formatDate,
  formatAttachment,
  FormatterFunction,
} from '../typeFormatters';

const originalMomentUnix = moment.unix;
afterEach(() => {
  moment.unix = originalMomentUnix;
});

const formatDateFn = () => {
  let sec = 0;
  const next = () => {
    sec += 1;
    return `${sec}`;
  };
  return next;
};

const testEmptyField = (formatter: FormatterFunction) => {
  const field: any[] = [];
  const value = formatter(field, {});
  expect(value).toBe('');
};

describe('csvExporter typeFormatters', () => {
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

  it('should return the correct DATE value', () => {
    const field = [{ value: 1585851003 }];

    const formatFn = jest.fn(formatDateFn());
    moment.unix = jest.fn(() => ({
      format: formatFn,
    }));

    const value = typeFormatters.date(field, {});
    expect(value).toBe('1');
    expect(moment.unix).toHaveBeenLastCalledWith(1585851003);
    expect(formatFn).toHaveBeenLastCalledWith('YYYY-MM-DD');

    testEmptyField(typeFormatters.date);
  });

  it('should return the correct MULTIDATE value', () => {
    const singleField = [{ value: 1585851003 }];
    const multipleField = [{ value: 1585851003 }, { value: 1585915200 }];

    const formatFn = jest.fn(formatDateFn());
    const unixFn = jest.fn(() => ({
      format: formatFn,
    }));
    moment.unix = unixFn;

    const singleValue = typeFormatters.multidate(singleField, {});

    expect(singleValue).toBe('1');
    expect(unixFn).toHaveBeenCalledTimes(1);
    expect(formatFn).toHaveBeenCalledTimes(1);

    formatFn.mockClear();
    unixFn.mockClear();

    const multipleValue = typeFormatters.multidate(multipleField, {});

    expect(multipleValue).toBe('2|3');
    expect(unixFn).toHaveBeenCalledTimes(2);
    expect(formatFn).toHaveBeenCalledTimes(2);

    testEmptyField(typeFormatters.multidate);
  });

  it('should return the correct DATERANGE value', () => {
    const field = [{ value: { from: 1585851003, to: 1585915200 } }];

    const formatFn = jest.fn(formatDateFn());
    moment.unix = jest.fn(() => ({
      format: formatFn,
    }));

    const value = typeFormatters.daterange(field, {});
    expect(value).toBe('1~2');
    expect(moment.unix).toHaveBeenCalledTimes(2);
    expect(formatFn).toHaveBeenCalledTimes(2);

    testEmptyField(typeFormatters.daterange);
  });

  it('should return the correct MULTIDATERANGE value', () => {
    const singleField = [{ value: { from: 1585851003, to: 1585915200 } }];
    const multipleField = [
      { value: { from: 1585851003, to: 1585915200 } },
      { value: { from: 1585851003, to: 1585915200 } },
    ];

    const formatFn = jest.fn(formatDateFn());
    const unixFn = jest.fn(() => ({
      format: formatFn,
    }));
    moment.unix = unixFn;

    const singleValue = typeFormatters.multidaterange(singleField, {});

    expect(singleValue).toBe('1~2');
    expect(unixFn).toHaveBeenCalledTimes(2);
    expect(formatFn).toHaveBeenCalledTimes(2);

    formatFn.mockClear();
    unixFn.mockClear();

    const multipleValue = typeFormatters.multidaterange(multipleField, {});

    expect(multipleValue).toBe('3~4|5~6');
    expect(unixFn).toHaveBeenCalledTimes(4);
    expect(formatFn).toHaveBeenCalledTimes(4);

    testEmptyField(typeFormatters.multidaterange);
  });

  it('should return the correct GEOLOCATION value', () => {
    const field = [{ value: { lat: '46.2050242', lon: '6.1090692' } }];
    const value = typeFormatters.geolocation(field, {});
    expect(value).toBe('46.2050242|6.1090692');
    testEmptyField(typeFormatters.geolocation);
  });

  it('should return the correct IMAGE url', () => {
    const field = [{ value: 'image.jpg' }];
    const value = typeFormatters.image(field, {});
    expect(value).toBe('image.jpg');
    testEmptyField(typeFormatters.image);
  });

  it('should return the correct LINK value', () => {
    const field = [{ value: { label: 'UWAZI', url: 'uwazi.io' } }];
    const value = typeFormatters.link(field, {});
    expect(value).toBe('UWAZI|uwazi.io');
    testEmptyField(typeFormatters.link);
  });

  it('should return the correct MEDIA value', () => {
    const field = [{ value: 'media_url' }];
    const value = typeFormatters.media(field, {});
    expect(value).toBe('media_url');
    testEmptyField(typeFormatters.media);
  });

  it('should return the correct NUMERIC value', () => {
    const field = [{ value: 1234 }];
    const value = typeFormatters.numeric(field, {});
    expect(value).toBe(1234);
    testEmptyField(typeFormatters.numeric);
  });

  it('should return the correct RELATIONSHIP value', () => {
    const singleField = [{ label: 'Entity 1' }];
    const multipleField = [{ label: 'Entity 1' }, { label: 'Entity 2' }];

    const singleValue = typeFormatters.relationship(singleField, {});
    const multipleValue = typeFormatters.relationship(multipleField, {});

    expect(singleValue).toBe('Entity 1');
    expect(multipleValue).toBe('Entity 1|Entity 2');
    testEmptyField(typeFormatters.relationship);
  });

  it('should return the correct TEXT value', () => {
    const field = [{ value: 'text' }];
    const value = typeFormatters.text(field, {});
    expect(value).toBe('text');
    testEmptyField(typeFormatters.text);
  });

  it('should return the correct DOCUMENTS value', () => {
    const singleField = [{ filename: 'file1.pdf' }];
    const multipleField = [{ filename: 'file1.pdf' }, { filename: 'file2.pdf' }];

    const singleValue = typeFormatters.documents(singleField, {});
    const multipleValue = typeFormatters.documents(multipleField, {});

    expect(singleValue).toBe(formatFile('file1.pdf'));
    expect(multipleValue).toBe(`${formatFile('file1.pdf')}|${formatFile('file2.pdf')}`);
    testEmptyField(typeFormatters.documents);
  });

  it('should return the correct ATTACHMENTS value', () => {
    const singleField = [{ filename: 'file1.pdf', entityId: 'entity1' }];
    const multipleField = [
      { filename: 'file1.pdf', entityId: 'entity1' },
      { filename: 'file2.pdf', entityId: 'entity1' },
    ];

    const singleValue = typeFormatters.attachments(singleField, {});
    const multipleValue = typeFormatters.attachments(multipleField, {});

    expect(singleValue).toBe(formatAttachment('file1.pdf', 'entity1'));
    expect(multipleValue).toBe(
      `${formatAttachment('file1.pdf', 'entity1')}|${formatAttachment('file2.pdf', 'entity1')}`
    );
    testEmptyField(typeFormatters.attachments);
  });

  it('should format timestamps to the provided format', () => {
    const timestamp = 1585851003;
    const format1 = 'YYYY/MM/DD';

    const formatFn = jest.fn(formatDateFn());
    const unixFn = jest.fn(() => ({
      format: formatFn,
    }));
    moment.unix = unixFn;

    const formatted1 = formatDate(timestamp, format1);

    expect(unixFn).toHaveBeenCalledWith(timestamp);
    expect(formatFn).toHaveBeenCalledWith(format1);
    expect(formatted1).toBe('1');
  });

  it('should build the correct document url', () => {
    const fileName = 'fileName.pdf';

    const url = formatFile(fileName);

    expect(url).toBe('/files/fileName.pdf');
  });

  it('should build the correct attachment url', () => {
    const fileName = 'fileName.pdf';
    const entityId = 'entity1';

    const url = formatAttachment(fileName, entityId);

    expect(url).toBe('/api/attachments/download?_id=entity1&file=fileName.pdf');
  });
});
