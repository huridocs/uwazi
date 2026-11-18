import { translationsRoutes } from '#api/core/infrastructure/express/translation/routes.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { ParityHarness, callers } from './ParityHarness.js';

const translation = getFixturesFactory().v2.database.translationDBO;
const harness = new ParityHarness(translationsRoutes);

const system = { id: 'System', type: 'Uwazi UI', label: 'User Interface' } as const;
const template = { id: 'templateId', type: 'Entity', label: 'Template' } as const;

describe('translations client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [
        {
          languages: [
            { key: 'en', label: 'English', default: true },
            { key: 'es', label: 'Spanish' },
          ],
        },
      ],
      translationsV2: [
        translation('Search', 'Search', 'en', system),
        translation('Search', 'Buscar', 'es', system),
        translation('title', 'Template', 'en', template),
        translation('title', 'Plantilla', 'es', template),
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('getLegacy should match GET /api/translations', async () => {
    const http = await harness.as(callers.anonymous).http('/api/translations');
    const client = await harness
      .as(callers.anonymous)
      .client(async c => c.translations.getLegacy());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
    expect(client.rows).toHaveLength(2);
  });

  it('getLegacy with a context and locale should match the filtered HTTP response', async () => {
    const query = { context: 'System', locale: 'es' } as const;

    const http = await harness.as(callers.anonymous).http('/api/translations', query);
    const client = await harness
      .as(callers.anonymous)
      .client(async c => c.translations.getLegacy(query));

    expect(client).toEqual(http.body);
    expect(client.rows).toMatchObject([{ locale: 'es', contexts: [{ id: 'System' }] }]);
  });

  it('getLegacy should throw the validation error the route answers 400 for', async () => {
    const http = await harness.as(callers.anonymous).http('/api/translations', { locale: 'xx' });
    const failure = harness
      .as(callers.anonymous)
      // @ts-expect-error an unsupported locale is what is being tested
      .client(async c => c.translations.getLegacy({ locale: 'xx' }));

    expect(http.status).toBe(400);
    await expect(failure).rejects.toMatchObject({ code: 400 });
  });

  it('getEntries should match GET /api/v2/translations', async () => {
    const http = await harness.as(callers.anonymous).http('/api/v2/translations');
    const client = await harness
      .as(callers.anonymous)
      .client(async c => c.translations.getEntries());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
    expect(client).toHaveLength(4);
  });
});
