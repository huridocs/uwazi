/** @format */

import { RequestParams } from '../RequestParams';

describe('RequestParams', () => {
  it('should have data and headers accessible', () => {
    const requestParams = new RequestParams('data', 'headers');

    expect(requestParams.data).toBe('data');
    expect(requestParams.headers).toBe('headers');
  });

  describe('onlyHeaders', () => {
    it('should return a new RequestParams with only the headers', () => {
      const requestParams = new RequestParams('data', 'headers').onlyHeaders();

      expect(requestParams.data).not.toBeDefined();
      expect(requestParams.headers).toBe('headers');
    });
  });

  describe('add', () => {
    it('should return a new RequestParams with data merged', () => {
      const requestParams = new RequestParams<{ param?: string; param2?: string }>(
        { param: 'value' },
        'headers'
      );

      const newRequestParams = requestParams.add({ param2: 'value2' });

      expect(newRequestParams.data).toEqual({ param: 'value', param2: 'value2' });
      expect(requestParams.headers).toBe('headers');
    });
  });
});
