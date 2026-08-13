import type { Request, Response, NextFunction } from 'express';
import { embedFrameHeaders } from '../embedFrameHeaders.js';

const runMiddleware = (path: string) => {
  const headers: Record<string, string> = {
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Frame-Options': 'SAMEORIGIN',
  };
  const req = { path } as Request;
  const res = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
    removeHeader: (name: string) => {
      delete headers[name];
    },
  } as unknown as Response;
  const next = jest.fn() as NextFunction;

  embedFrameHeaders(req, res, next);

  return { headers, next };
};

describe('embedFrameHeaders', () => {
  it('should allow cross-origin framing for /embed routes', () => {
    const { headers, next } = runMiddleware('/embed/dataviz/6a3e786003890bdca59f79c5');

    expect(headers['Content-Security-Policy']).toBe('frame-ancestors *');
    expect(headers['Cross-Origin-Resource-Policy']).toBe('cross-origin');
    expect(headers['X-Frame-Options']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should not change headers for non-embed routes', () => {
    const { headers, next } = runMiddleware('/api/dataviz');

    expect(headers['Cross-Origin-Resource-Policy']).toBe('same-origin');
    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(headers['Content-Security-Policy']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
