// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';

import { ValidateFormatError, ValidateFormatOptions, peekHeaders, validateFormat } from '../csv';
import { mockCsvFileReadStream } from './helpers';

const mockFileStream = (content: string) => {
  const mockedFile = mockCsvFileReadStream(content);
  const mockedFileStream = fs.createReadStream('mocked_file');
  return { mockedFile, mockedFileStream };
};

const expectThrow = async (
  fn: () => Promise<void>,
  errorClass: any,
  message?: string,
  finallyCallback?: () => Promise<void>
) => {
  try {
    await fn();
    expect.fail(`Should have thrown an ${errorClass.name} error.`);
  } catch (e) {
    expect(e).toBeInstanceOf(errorClass);
    if (message) {
      expect(e.message).toBe(message);
    }
  } finally {
    if (finallyCallback) {
      await finallyCallback();
    }
  }
};

describe('peekHeaders()', () => {
  it('should return the headers of a CSV file', async () => {
    const content = `title, textprop, textprop__es, textprop__en
    title1, text1, text1_es, text1_en`;
    const { mockedFile, mockedFileStream } = mockFileStream(content);
    const headers = await peekHeaders(mockedFileStream);
    expect(headers).toEqual(['title', ' textprop', ' textprop__es', ' textprop__en']);
    mockedFile.mockRestore();
  });
});

describe('validateFormat()', () => {
  const expectValidateFormatError = async (
    content: string,
    options: ValidateFormatOptions,
    message: string
  ) => {
    const { mockedFile, mockedFileStream } = mockFileStream(content);
    await expectThrow(
      async () => validateFormat(mockedFileStream, options),
      ValidateFormatError,
      message,
      async () => mockedFile.mockRestore()
    );
  };

  const validateProperly = async (content: string, options: ValidateFormatOptions) => {
    const { mockedFile, mockedFileStream } = mockFileStream(content);
    await validateFormat(mockedFileStream, options);
    mockedFile.mockRestore();
  };

  it('should be able to check the number of columns', async () => {
    const content = 'title,textprop\ntitle1, text1';

    await expectValidateFormatError(
      content,
      { column_number: 3 },
      'Expected 3 columns, but found 2.'
    );

    await validateProperly(content, { column_number: 2 });
  });

  it('should be able to check the required column names', async () => {
    const content = 'title,textprop,extra_is_okay\nvalue1,value2,value3';

    await expectValidateFormatError(
      content,
      { required_headers: ['title', 'missing', 'also_missing'] },
      'Missing required headers: missing, also_missing.'
    );

    await validateProperly(content, { required_headers: ['title', 'textprop'] });
  });

  it('should be able to check for no empty values', async () => {
    const missingInFirstLine = 'title,textprop\nvalue1,';
    await expectValidateFormatError(
      missingInFirstLine,
      { no_empty_values: true },
      'Empty value at row 1, column "textprop".'
    );

    const missingInSecondLine = 'title,textprop,number\nvalue1,value2,0\nvalue3,,0';
    await expectValidateFormatError(
      missingInSecondLine,
      { no_empty_values: true },
      'Empty value at row 2, column "textprop".'
    );
    await validateProperly(missingInSecondLine, { no_empty_values: false });

    const full = 'title,textprop\nvalue1,value2';
    await validateProperly(full, { no_empty_values: true });
  });
});
