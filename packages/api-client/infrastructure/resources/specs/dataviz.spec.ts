import { ObjectId } from 'mongodb';

import datavizRoutes from '#api/dataviz.v2/infrastructure/http/routes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MANUAL_DATA_EXAMPLE } from '#shared/dataviz/manualData.js';

import { ParityHarness, callers } from './ParityHarness.js';

const harness = new ParityHarness(datavizRoutes);
const chartId = new ObjectId();

describe('dataviz client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      dataviz: [
        {
          _id: chartId,
          name: 'Manual chart',
          dataSource: 'manual',
          query: {
            sources: [],
            dimensions: [],
            measures: [{ aggregation: 'count', countMode: 'all' }],
          },
          manualData: MANUAL_DATA_EXAMPLE,
          chart: { type: 'pie' },
          appearance: { colorMode: 'theme' },
          refresh: { refreshMode: 'live' },
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each([
    ['admin', callers.admin],
    ['editor', callers.editor],
    ['anonymous', callers.anonymous],
  ])('list should match GET /api/dataviz for %s', async (_label, caller) => {
    const { http, client } = await harness
      .as(caller)
      .outcomes('/api/dataviz', async c => c.dataviz.list());

    expect(client).toEqual(http);
  });

  it('list should return the charts to admins', async () => {
    const body = await harness.as(callers.admin).client(async c => c.dataviz.list());

    expect(body.rows).toMatchObject([{ id: chartId.toString(), name: 'Manual chart' }]);
  });

  it.each([
    ['an existing chart, as admin', callers.admin, chartId.toString()],
    ['a missing chart, as admin', callers.admin, new ObjectId().toString()],
    ['an existing chart, as editor', callers.editor, chartId.toString()],
  ])('getById should match GET /api/dataviz/:id for %s', async (_label, caller, id) => {
    const { http, client } = await harness
      .as(caller)
      .outcomes(`/api/dataviz/${id}`, async c => c.dataviz.getById(id));

    expect(client).toEqual(http);
  });
});
