import { FetchResponseError } from '#shared/JSONRequest.js';
import { apiCall, legacyApiCall } from '../helpers.js';

describe('apiCall', () => {
  it('returns a tuple with data on success', async () => {
    const [data, error] = await apiCall(async () => 'ok');
    expect(data).toBe('ok');
    expect(error).toBeUndefined();
  });

  it('returns a tuple with error on failure', async () => {
    const thrown = new FetchResponseError('Not found', { status: 404, json: {} });
    const [data, error] = await apiCall(async () => {
      throw thrown;
    });
    expect(data).toBeUndefined();
    expect(error).toBe(thrown);
  });
});

describe('legacyApiCall', () => {
  it('treats FetchResponseError return values as errors', async () => {
    const returned = new FetchResponseError('Forbidden', { status: 403, json: {} });
    const [data, error] = await legacyApiCall(async () => returned);
    expect(data).toBeUndefined();
    expect(error).toBe(returned);
  });

  it('returns successful values in the tuple', async () => {
    const [data, error] = await legacyApiCall(async () => [{ _id: '1' }]);
    expect(data).toEqual([{ _id: '1' }]);
    expect(error).toBeUndefined();
  });
});
