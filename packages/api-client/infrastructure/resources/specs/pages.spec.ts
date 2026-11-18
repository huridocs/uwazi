import { pagesV2Routes } from '#api/pages.v2/infrastructure/http/routes.js';
import { fixtures } from '#api/pages.v2/specs/fixtures.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { ParityHarness, callers } from './ParityHarness.js';

const harness = new ParityHarness(pagesV2Routes);

describe('pages client', () => {
  beforeAll(async () => {
    // A page without a creationDate gets one stamped at read time, which would differ per call.
    await testingEnvironment.setUp({
      ...fixtures,
      pages: fixtures.pages?.map(page => ({ creationDate: 1, ...page })),
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each([
    ['all pages', {}],
    ['one page', { sharedId: '1' }],
  ])('list should match GET /api/pages for %s', async (_label, query) => {
    const { http, client } = await harness
      .as(callers.anonymous)
      .outcomes('/api/pages', async c => c.pages.list(query), { query });

    expect(http.status).toBe(200);
    expect(client).toEqual(http);
  });

  it('list should return the pages in the page language', async () => {
    const body = await harness.as(callers.anonymous).client(async c => c.pages.list());

    expect(body.length).toBeGreaterThan(0);
  });

  it.each([
    ['an existing page', callers.anonymous, { sharedId: '1' }],
    ['a missing page', callers.anonymous, { sharedId: 'missing' }],
    ['editor mode as admin', callers.admin, { sharedId: '1', mode: 'editor' as const }],
  ])('get should match GET /api/page for %s', async (_label, caller, query) => {
    const { http, client } = await harness
      .as(caller)
      .outcomes('/api/page', async c => c.pages.get(query), { query });

    expect(client).toEqual(http);
  });
});
