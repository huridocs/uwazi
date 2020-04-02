import typeFormatters, { formatFile, formatDate, formatAttachment } from '../typeFormatters';

const testUndefinedAndEmpty = formatter => {
  const undefinedField = undefined;
  const undefinedValue = formatter(undefinedField);

  const emptyField = [];
  const emptyValue = formatter(emptyField);

  expect(undefinedValue).toBe('');
  expect(emptyValue).toBe('');
};

// eslint-disable-next-line max-statements
describe('csvExporter typeFormatters', () => {
  it('should return the correct SELECT value', () => {
    const field = [{ label: 'label1', value: 'value1' }];
    const value = typeFormatters.select(field);
    expect(value).toBe('label1');
  });

  it('should not fail if SELECT field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.select);
  });

  it('should return the correct MULTISELECT value', () => {
    const singleField = [{ label: 'label1', value: 'value1' }];
    const multipleField = [
      { label: 'label1', value: 'value1' },
      { label: 'label2', value: 'value2' },
    ];

    const singleValue = typeFormatters.multiselect(singleField);
    const multipleValue = typeFormatters.multiselect(multipleField);

    expect(singleValue).toBe('label1');
    expect(multipleValue).toBe('label1|label2');
  });

  it('should not fail if MULTISELECT field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.multiselect);
  });

  it('should return the correct DATE value', () => {
    const field = [{ value: '1585851003' }];
    const value = typeFormatters.date(field);
    expect(value).toBe(formatDate(1585851003));
  });

  it('should not fail if DATE field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.date);
  });

  it('should return the correct MULTIDATE value', () => {
    const singleField = [{ value: '1585851003' }];
    const multipleField = [{ value: '1585851003' }, { value: '1585915200' }];

    const singleValue = typeFormatters.multidate(singleField);
    const multipleValue = typeFormatters.multidate(multipleField);

    expect(singleValue).toBe(formatDate(1585851003));
    expect(multipleValue).toBe(`${formatDate(1585851003)}|${formatDate(1585915200)}`);
  });

  it('should not fail if MULTIDATE field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.multidate);
  });

  it('should return the correct DATERANGE value', () => {
    const field = [{ value: { from: '1585851003', to: '1585915200' } }];
    const value = typeFormatters.daterange(field);
    expect(value).toBe(`${formatDate(1585851003)}~${formatDate(1585915200)}`);
  });

  it('should not fail if DATERANGE field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.daterange);
  });

  it('should return the correct MULTIDATERANGE value', () => {
    const singleField = [{ value: { from: '1585851003', to: '1585915200' } }];
    const multipleField = [
      { value: { from: '1585851003', to: '1585915200' } },
      { value: { from: '1585851003', to: '1585915200' } },
    ];

    const singleValue = typeFormatters.multidaterange(singleField);
    const multipleValue = typeFormatters.multidaterange(multipleField);

    expect(singleValue).toBe(`${formatDate(1585851003)}~${formatDate(1585915200)}`);
    expect(multipleValue).toBe(
      `${formatDate(1585851003)}~${formatDate(1585915200)}|${formatDate(1585851003)}~${formatDate(
        1585915200
      )}`
    );
  });

  it('should not fail if MULTIDATERANGE field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.multidaterange);
  });

  it('should return the correct GEOLOCATION value', () => {
    const field = [{ value: { lat: '46.2050242', lon: '6.1090692' } }];
    const value = typeFormatters.geolocation(field);
    expect(value).toBe('46.2050242|6.1090692');
  });

  it('should not fail if GEOLOCATION field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.geolocation);
  });

  it('should return the correct IMAGE url', () => {
    const field = [{ value: 'image.jpg' }];
    const value = typeFormatters.image(field);
    expect(value).toBe('image.jpg');
  });

  it('should not fail if IMAGE field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.image);
  });

  it('should return the correct LINK value', () => {
    const field = [{ value: { label: 'UWAZI', url: 'uwazi.io' } }];
    const value = typeFormatters.link(field);
    expect(value).toBe('UWAZI|uwazi.io');
  });

  it('should not fail if LINK field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.link);
  });

  it('should return the correct MEDIA value', () => {
    const field = [{ value: 'media_url' }];
    const value = typeFormatters.media(field);
    expect(value).toBe('media_url');
  });

  it('should not fail if MEDIA field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.media);
  });

  it('should return the correct NUMERIC value', () => {
    const field = [{ value: 1234 }];
    const value = typeFormatters.numeric(field);
    expect(value).toBe(1234);
  });

  it('should not fail if NUMERIC field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.numeric);
  });

  it('should return the correct RELATIONSHIP value', () => {
    const singleField = [{ label: 'Entity 1' }];
    const multipleField = [{ label: 'Entity 1' }, { label: 'Entity 2' }];

    const singleValue = typeFormatters.relationship(singleField);
    const multipleValue = typeFormatters.relationship(multipleField);

    expect(singleValue).toBe('Entity 1');
    expect(multipleValue).toBe('Entity 1|Entity 2');
  });

  it('should not fail if RELATIONSHIP field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.relationship);
  });

  it('should return the correct TEXT value', () => {
    const field = [{ value: 'text' }];
    const value = typeFormatters.text(field);
    expect(value).toBe('text');
  });

  it('should not fail if TEXT field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.text);
  });

  it('should return the correct DOCUMENTS value', () => {
    const singleField = [{ filename: 'file1.pdf' }];
    const multipleField = [{ filename: 'file1.pdf' }, { filename: 'file2.pdf' }];

    const singleValue = typeFormatters.documents(singleField);
    const multipleValue = typeFormatters.documents(multipleField);

    expect(singleValue).toBe(formatFile('file1.pdf'));
    expect(multipleValue).toBe(`${formatFile('file1.pdf')}|${formatFile('file2.pdf')}`);
  });

  it('should not fail if DOCUMENTS field is undefined or empty', () => {
    testUndefinedAndEmpty(typeFormatters.documents);
  });

  it('should return the correct ATTACHMENTS value', () => {
    const singleField = { attachments: [{ filename: 'file1.pdf' }], entityId: 'entity1' };
    const multipleField = {
      attachments: [{ filename: 'file1.pdf' }, { filename: 'file2.pdf' }],
      entityId: 'entity1',
    };

    const singleValue = typeFormatters.attachments(singleField);
    const multipleValue = typeFormatters.attachments(multipleField);

    expect(singleValue).toBe(formatAttachment('file1.pdf', 'entity1'));
    expect(multipleValue).toBe(
      `${formatAttachment('file1.pdf', 'entity1')}|${formatAttachment('file2.pdf', 'entity1')}`
    );
  });

  it('should not fail if ATTACHMENTS field is undefined or empty', () => {
    const emptyField = { attachments: [], entityId: 'entity1' };
    const undefinedField = { entityId: 'entity1' };

    const emptyValue = typeFormatters.attachments(emptyField);
    const undefinedValue = typeFormatters.attachments(undefinedField);

    expect(emptyValue).toBe('');
    expect(undefinedValue).toBe('');
  });

  it('should return the correct PUBLISHED value', () => {
    const published = { published: true };
    const unpublished = { published: false };

    const publishedField = typeFormatters.published(published);
    const unpublishedField = typeFormatters.published(unpublished);

    expect(publishedField).toBe('Published');
    expect(unpublishedField).toBe('Unpublished');
  });

  it('should not fail if PUBLISHED field is undefined or empty', () => {
    const undefinedField = {};
    const undefinedValue = typeFormatters.published(undefinedField);
    expect(undefinedValue).toBe('');
  });

  it('should format timestamps to the provided format', () => {
    const timestamp = 1585851003;
    const format1 = 'YYYY/MM/DD';
    const format2 = 'MM-DD-YYYY';

    const formated1 = formatDate(timestamp, format1);
    const formated2 = formatDate(timestamp, format2);
    const defaultFormat = formatDate(timestamp);

    expect(formated1).toBe('2020/04/02');
    expect(formated2).toBe('04-02-2020');
    expect(defaultFormat).toBe('2020-04-02');
  });
});
