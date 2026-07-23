/**
 * @jest-environment jsdom
 */
import { assertTransportSuccess, readResponseText } from '#shared/apiClient/transport/response.js';

describe('apiClient JSON response body', () => {
  it('preserves bare JSON arrays', () => {
    const result = readResponseText('[{"refId":"u1","type":"user"}]', 'application/json', 200);

    expect(result).toEqual({
      kind: 'json',
      body: [{ refId: 'u1', type: 'user' }],
      contentType: 'application/json',
    });
  });

  it('preserves empty arrays', () => {
    const result = readResponseText('[]', 'application/json', 200);
    expect(result).toEqual({ kind: 'json', body: [], contentType: 'application/json' });
  });

  it('keeps object bodies as records', () => {
    const result = readResponseText('{"ok":true}', 'application/json', 200);
    expect(result).toEqual({ kind: 'json', body: { ok: true }, contentType: 'application/json' });
  });

  it('still wraps non-object primitives', () => {
    const result = readResponseText('"ok"', 'application/json', 200);
    expect(result).toEqual({
      kind: 'json',
      body: { value: 'ok' },
      contentType: 'application/json',
    });
  });

  it('returns array body from assertTransportSuccess', () => {
    const body = readResponseText('[{"id":1}]', 'application/json', 200);
    const success = assertTransportSuccess(
      200,
      'OK',
      new Headers({ 'Content-Type': 'application/json' }),
      body,
      { method: 'GET', url: '/api/items' }
    );

    expect(success.body).toEqual([{ id: 1 }]);
  });
});
