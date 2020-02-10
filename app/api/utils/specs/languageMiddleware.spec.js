import db from 'api/utils/testing_db';
import middleware from '../languageMiddleware';
import fixtures from './languageFixtures.js';

describe('languageMiddleware', () => {
  let req;
  const res = {};
  let next;
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
    req = {
      get: headerName => ({ 'content-language': 'es', 'accept-language': 'en-US' }[headerName]),
    };
    next = jasmine.createSpy('next');
  });

  afterAll(async () => {
    await db.disconnect();
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
        req = {
          get: headerName => ({ 'accept-language': 'en-US' }[headerName]),
        };
        await middleware(req, res, next);
        expect(req.language).toBe('en');
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('when language do not exist on the config', () => {
    it('should set the default one "es"', async () => {
      req = {
        get: headerName => ({ 'content-language': 'nonExistent' }[headerName]),
      };

      await middleware(req, res, next);
      expect(req.language).toBe('es');
      expect(next).toHaveBeenCalled();
    });
  });
});
