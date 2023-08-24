import db from 'api/utils/testing_db';
import { Request, NextFunction, Response } from 'express';
import middleware from '../languageMiddleware';
import fixtures from './languageFixtures';

describe('languageMiddleware', () => {
  let req: Request;
  const res: Response = <Response>{};
  let next: NextFunction;

  const createRequest = (request: Partial<Request>) => <Request>{ ...request };

  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
    req = <Request>{
      get: (headerName: string) =>
        //@ts-ignore
        ({ 'content-language': 'es', 'accept-language': 'en-US' })[headerName],
    };
    next = jest.fn();
  });

  afterAll(async () => {
    await db.disconnect();
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
});
