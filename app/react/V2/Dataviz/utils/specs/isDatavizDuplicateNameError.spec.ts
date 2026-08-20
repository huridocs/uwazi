import { FetchResponseError } from '#shared/JSONRequest.js';
import {
  DATAVIZ_DUPLICATE_NAME_CODE,
  isDatavizDuplicateNameError,
} from '../isDatavizDuplicateNameError.js';

describe('isDatavizDuplicateNameError', () => {
  it('should detect a 409 response with the duplicate name code', () => {
    const error = new FetchResponseError('Request failed', {
      status: 409,
      json: {
        code: DATAVIZ_DUPLICATE_NAME_CODE,
        error: 'A dataviz named "Test" already exists',
      },
    });

    expect(isDatavizDuplicateNameError(error)).toBe(true);
  });

  it('should ignore other API errors', () => {
    const error = new FetchResponseError('Request failed', {
      status: 500,
      json: { error: 'Unexpected error' },
    });

    expect(isDatavizDuplicateNameError(error)).toBe(false);
  });

  it('should ignore non-fetch errors', () => {
    expect(isDatavizDuplicateNameError(new Error('A dataviz named "Test" already exists'))).toBe(
      false
    );
  });
});
