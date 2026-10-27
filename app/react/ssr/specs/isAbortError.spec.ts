/**
 * @jest-environment node
 */
import { isAbortError } from '../isAbortError.js';

describe('isAbortError', () => {
  it('returns true for DOMException AbortError (Node abort reason)', () => {
    const controller = new AbortController();
    controller.abort();
    expect(isAbortError(controller.signal.reason)).toBe(true);
  });

  it('returns true for an Error named AbortError', () => {
    const error = new Error('This operation was aborted');
    error.name = 'AbortError';
    expect(isAbortError(error)).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isAbortError(new Error('boom'))).toBe(false);
    expect(isAbortError({ name: 'TypeError' })).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError('AbortError')).toBe(false);
  });
});
