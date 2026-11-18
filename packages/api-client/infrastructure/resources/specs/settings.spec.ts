import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { settingsRoutes } from '#api/core/infrastructure/express/settings/routes.js';

import { ParityHarness, callers } from './ParityHarness.js';

const harness = new ParityHarness(settingsRoutes);

describe('settings client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [
        {
          site_name: 'Parity',
          languages: [{ key: 'en', label: 'English', default: true }],
          links: [{ title: 'Home', url: '/', type: 'link', sublinks: [] }],
          mailerConfig: 'admin only',
        },
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each([
    ['admin', callers.admin],
    ['anonymous', callers.anonymous],
  ])('get should match GET /api/settings for %s', async (_name, caller) => {
    const http = await harness.as(caller).http('/api/settings');
    const client = await harness.as(caller).client(async c => c.settings.get());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
  });

  it('getLinks should match GET /api/settings/links', async () => {
    const http = await harness.as(callers.anonymous).http('/api/settings/links');
    const client = await harness.as(callers.anonymous).client(async c => c.settings.getLinks());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
    expect(client).toHaveLength(1);
  });
});
