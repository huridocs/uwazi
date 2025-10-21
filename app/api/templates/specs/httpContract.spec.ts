import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { Application, NextFunction } from 'express';
import request from 'supertest';
import templateRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const emitToCurrentTenantSpy = jest.fn();

const f = getFixturesFactory();

describe('templates routes contract', () => {
  const app: Application = setUpApp(templateRoutes, (req, _res, next: NextFunction) => {
    req.sockets = { emitToCurrentTenant: emitToCurrentTenantSpy };
    next();
  });

  const postToEndpoint = async (route: string, body: any) => request(app).post(route).send(body);

  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [
        { site_name: 'Uwazi', languages: [{ key: 'en', label: 'English', default: true }] },
      ],
      templates: [
        { ...f.template('template1', []), default: true },
        { ...f.template('template2', []), default: false },
      ],
    });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST', () => {
    describe('Create', () => {
      it('should return created template', async () => {
        const template = { ...f.template('new template'), _id: undefined };
        const response = await postToEndpoint('/api/templates', template);
        if (response.status !== 200) {
          throw JSON.parse(response.text);
        }
        expect(JSON.parse(response.text).name).toBe('new template');
      });

      it('should return error when sending invalid template props', async () => {
        const template = { ...f.template('new template'), _id: undefined, invalid_prop: true };
        const response = await postToEndpoint('/api/templates', template);

        expect(response.status).toBe(422);
        expect(response.text.match('invalid_prop')).toBeTruthy();
      });

      it('should allow specific (non valid) properties for backwards compatibility', async () => {
        const template = {
          ...f.template('backwards compatible template'),
          _id: undefined,
          default: true,
          processing: { active: true },
          __v: 5,
        };
        const response = await postToEndpoint('/api/templates', template);

        if (response.status !== 200) {
          throw JSON.parse(response.text);
        }

        expect(JSON.parse(response.text).name).toBe('backwards compatible template');
        expect(JSON.parse(response.text).default).toBe(false);
        expect(JSON.parse(response.text).processing).toEqual({ active: false });
        expect(JSON.parse(response.text).__v).toBeUndefined();
      });
    });

    describe('Update', () => {
      it('should return updated template', async () => {
        const template = f.template('template1', [], { name: 'template1 updated' });
        const response = await postToEndpoint('/api/templates', template);
        if (response.status !== 200) {
          throw JSON.parse(response.text);
        }
        expect(JSON.parse(response.text).name).toBe('template1 updated');
      });

      it('should return error when sending invalid template props', async () => {
        const template = f.template('template1', [], { invalid_prop: true });
        const response = await postToEndpoint('/api/templates', template);

        expect(response.status).toBe(422);
        expect(response.text.match('invalid_prop')).toBeTruthy();
      });

      it('should allow specific (non valid) properties for backwards compatibility', async () => {
        const template = f.template('template2', [], {
          default: true,
          processing: { active: true },
          __v: 5,
        });

        const response = await postToEndpoint('/api/templates', template);

        if (response.status !== 200) {
          throw JSON.parse(response.text);
        }

        expect(JSON.parse(response.text).name).toBe('template2');
        expect(JSON.parse(response.text).default).toBe(false);
        expect(JSON.parse(response.text).processing).toEqual({ active: false });
        expect(JSON.parse(response.text).__v).toBeUndefined();
      });
    });
  });
});
