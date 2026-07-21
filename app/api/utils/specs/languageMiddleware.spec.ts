import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { NextFunction, Request, Response } from 'express';
import settings from '#api/settings/settings.js';
import middleware from '../languageMiddleware.js';
import fixtures from './languageFixtures.js';

describe('languageMiddleware', () => {
  let req: Request;
  const res: Response = <Response>{};
  let next: NextFunction;

  const createRequest = (request: Partial<Request>) => <Request>{ ...request };

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    req = <Request>{
      get: (headerName: string) =>
        //@ts-ignore
        ({ 'content-language': 'es', 'accept-language': 'en-US' })[headerName],
    };
    next = jest.fn();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when there is an error', () => {
    it('should call next with the error', async () => {
      req = createRequest({
        //@ts-ignore
        get: () => {
          throw new Error('error');
        },
        cookies: {
          locale: 'en',
        },
      });
      await middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('error'));
    });
  });

  describe('when language exists on the config', () => {
    it('should set req.language with content-language', async () => {
      await middleware(req, res, next);

      expect(req.language).toBe('es');
      expect(next).toHaveBeenCalled();
    });

    describe('when no content-language', () => {
      it('should use cookies.locale', async () => {
        req = {
          //@ts-ignore
          get: () => {},
          cookies: {
            locale: 'en',
          },
        };
        await middleware(req, res, next);
        expect(req.language).toBe('en');
        expect(next).toHaveBeenCalled();
      });
    });

    describe('when no content-language and no cookie', () => {
      it('should use accept-language', async () => {
        req = createRequest({
          //@ts-ignore
          get: (headerName: string) => ({ 'accept-language': 'en-US' })[headerName],
        });
        await middleware(req, res, next);
        expect(req.language).toBe('en');
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('when language do not exist on the config', () => {
    it('should set the default one "es"', async () => {
      req = createRequest({
        //@ts-ignore
        get: (headerName: string) => ({ 'content-language': 'nonExistent' })[headerName],
      });

      await middleware(req, res, next);
      expect(req.language).toBe('es');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('public dataviz embed routes', () => {
    it('should prefer ?locale= query param on /api/public/dataviz paths', async () => {
      const current = await settings.get();
      await settings.save({
        ...current,
        languages: [...(current.languages ?? []), { key: 'pt', label: 'Portuguese' }],
      });

      req = createRequest({
        path: '/api/public/dataviz/dv1/data',
        query: { locale: 'pt' },
        //@ts-ignore
        get: () => undefined,
        cookies: { locale: 'en' },
      });

      await middleware(req, res, next);
      expect(req.language).toBe('pt');
    });
  });
});
