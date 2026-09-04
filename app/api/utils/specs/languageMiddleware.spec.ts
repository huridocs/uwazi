import { testingEnvironment, SettingsDSWithContext } from '#api/utils/testingEnvironment.js';
import type { NextFunction, Request, Response } from 'express';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import middleware from '../languageMiddleware.js';
import fixtures from './languageFixtures.js';

const createRequest = (request: Partial<Request>) => <Request>{ ...request };

describe('languageMiddleware', () => {
  let req: Request;
  const res: Response = <Response>{};
  let next: NextFunction;

  const runMiddleware = async () =>
    testingEnvironment.runWithContext(async () => middleware(req, res, next));

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
      await runMiddleware();
      expect(next).toHaveBeenCalledWith(new Error('error'));
    });
  });

  describe('when language exists on the config', () => {
    it('should set req.language with content-language', async () => {
      await runMiddleware();

      expect(req.language).toBe('es');
      expect(next).toHaveBeenCalled();
    });

    describe('when no content-language', () => {
      it('should use cookies.locale', async () => {
        req = createRequest({
          //@ts-ignore
          get: () => {},
          cookies: {
            locale: 'en',
          },
        });

        await runMiddleware();
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
        await runMiddleware();
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

      await runMiddleware();
      expect(req.language).toBe('es');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('public dataviz embed routes', () => {
    it('should prefer ?locale= query param on /api/public/dataviz paths', async () => {
      const current = await SettingsDSWithContext.default().readFields(['languages']);
      await testingEnvironment.runWithContext(async () =>
        SaveSettingsUseCaseFactory.default().execute({
          languages: [...(current?.languages ?? []), { key: 'pt', label: 'Portuguese' }],
        })
      );

      req = createRequest({
        path: '/api/public/dataviz/dv1/data',
        query: { locale: 'pt' },
        //@ts-ignore
        get: () => undefined,
        cookies: { locale: 'en' },
      });

      await runMiddleware();
      expect(req.language).toBe('pt');
    });
  });
});
