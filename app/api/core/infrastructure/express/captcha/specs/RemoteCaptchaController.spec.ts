import type { Application } from 'express';
import request from 'supertest';
import JSONRequest from '#shared/JSONRequest.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { RemoteCaptchaController } from '../RemoteCaptchaController.js';

const getRoute = (app: Application) => {
  app.get('/api/remotecaptcha', RemoteCaptchaController.createHandler());
};

describe('RemoteCaptchaController integration', () => {
  const app: Application = setUpApp(getRoute);

  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [
        {
          languages: [{ key: 'en', label: 'English', default: true }],
          publicFormDestination: 'https://remote.uwazi.io',
        },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should forward the request to the public form destination and return its json body', async () => {
    jest
      .spyOn(JSONRequest, 'get')
      .mockResolvedValue({ json: { svg: '<svg></svg>', id: 'remote-id' } } as any);

    const response = await request(app).get('/api/remotecaptcha');

    expect(response).toHaveStatus(200);
    expect(response.body).toEqual({ svg: '<svg></svg>', id: 'remote-id' });
    expect(JSONRequest.get).toHaveBeenCalledWith('https://remote.uwazi.io/api/captcha');
  });

  it('should return 400 when publicFormDestination is not configured', async () => {
    const collection = testingEnvironment.db.getCollection('settings')!;
    const settings = (await collection.findOne({}))!;
    settings.publicFormDestination = '';
    await collection.replaceOne({}, settings);

    jest
      .spyOn(JSONRequest, 'get')
      .mockRejectedValue(new TypeError('Only absolute URLs are supported'));

    const response = await request(app).get('/api/remotecaptcha');

    expect(response).toHaveStatus(400);
    expect(response.body.error).toContain('Remote public form destination not configured');
    expect(JSONRequest.get).not.toHaveBeenCalled();
  });
});
