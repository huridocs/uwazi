import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { ListActivityOutputSchema, ListActivityRequestSchema } from '../../contracts.js';
import { ListActivityController } from '../ListActivityController.js';

const entry = (
  fields: { method: string; url: string; time: number; username?: string },
  extra: object = {}
) => ({
  query: '{"q":"secret"}',
  params: '{"id":"1"}',
  body: '{"title":"secret"}',
  user: 'a-user-id',
  expireAt: new Date('2030-01-01T00:00:00.000Z'),
  ...fields,
  ...extra,
});

const fixtures = {
  activitylogs: [
    entry({ method: 'POST', url: '/api/entities', time: 1_000, username: 'admin' }),
    entry({ method: 'DELETE', url: '/api/files', time: 3_000, username: 'editor' }),
    entry({ method: 'PUT', url: '/api/templates', time: 2_000 }),
  ],
};

describe('ListActivityController', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const list = async (request: object) =>
    ControllerSpecs.asCli(async () =>
      ListActivityController.handle(ListActivityRequestSchema.parse(request))
    );

  it("should list the tenant's latest entries in the CLI output contract", async () => {
    const output = ListActivityOutputSchema.element
      .strict()
      .array()
      .parse(await list({}));

    expect(output).toEqual([
      { method: 'DELETE', url: '/api/files', username: 'editor', time: 3_000 },
      { method: 'PUT', url: '/api/templates', username: null, time: 2_000 },
      { method: 'POST', url: '/api/entities', username: 'admin', time: 1_000 },
    ]);
  });

  it('should return only as many entries as the limit asks', async () => {
    expect((await list({ limit: 2 })).map(item => item.time)).toEqual([3_000, 2_000]);
  });

  it('should not print what the requests carried', async () => {
    const [latest] = await list({ limit: 1 });

    expect(Object.keys(latest).sort()).toEqual(['method', 'time', 'url', 'username']);
  });

  describe('request', () => {
    it('should default the limit to 20', () => {
      expect(ListActivityRequestSchema.parse({})).toEqual({ limit: 20 });
    });

    it.each([1, 20, 100])('should accept a limit of %s', limit => {
      expect(ListActivityRequestSchema.parse({ limit })).toEqual({ limit });
    });

    it.each([
      ['a limit of zero', { limit: 0 }],
      ['a limit above the cap', { limit: 101 }],
      ['a limit that is not an integer', { limit: 1.5 }],
      ['a limit that is not a number', { limit: '5' }],
      ['an unknown field', { limit: 5, username: 'admin' }],
    ])('should reject a request with %s', (_case, request) => {
      expect(() => ListActivityRequestSchema.parse(request)).toThrow();
    });
  });
});
