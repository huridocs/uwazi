import { ObjectId } from 'mongodb';

import { paragraphExtractionRoutes } from '#api/paragraphExtraction/adapters/PXRoutes.js';
import {
  entityFixtures,
  fixtures,
  paragraphNumberProperty,
  paragraphProperty,
  relationshipTypesFixtures,
  templateFixtures,
} from '#api/paragraphExtraction/adapters/specs/fixtures.js';
import { tenants } from '#api/tenants/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import type { ServerApiClient } from '../../../application/ServerApiClient.js';
import { ParityHarness, callers } from './ParityHarness.js';

const harness = new ParityHarness(paragraphExtractionRoutes);
const extractorId = new ObjectId();

const extractor = {
  _id: extractorId,
  sourceTemplateId: templateFixtures.sourceTemplate._id,
  targetTemplateId: templateFixtures.targetTemplate._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id,
  paragraphPropertyId: paragraphProperty._id,
  sourceRelationshipTypeId: relationshipTypesFixtures.sourceRelationshipType._id,
  targetRelationshipTypeId: relationshipTypesFixtures.targetRelationshipType._id,
};

const statusesQuery = {
  id: extractorId.toString(),
  page: { number: 1, size: 2 },
  filter: { status: ['processing' as const] },
};

const paragraphsQuery = {
  id: entityFixtures.entity1En.sharedId!,
  extractorId: extractorId.toString(),
  page: { number: 1, size: 3 },
};

type Call = {
  name: string;
  path: string;
  query: object;
  call: (c: ServerApiClient) => Promise<unknown>;
};

const calls: Call[] = [
  {
    name: 'getExtractors',
    path: '/api/paragraphExtraction/extractors',
    query: {},
    call: async c => c.paragraphExtraction.getExtractors(),
  },
  {
    name: 'getExtractorStatuses',
    path: '/api/paragraphExtraction/extractorStatuses',
    query: statusesQuery,
    call: async c => c.paragraphExtraction.getExtractorStatuses(statusesQuery),
  },
  {
    name: 'getEntityParagraphs',
    path: '/api/paragraphExtraction/entityParagraphs',
    query: paragraphsQuery,
    call: async c => c.paragraphExtraction.getEntityParagraphs(paragraphsQuery),
  },
];

describe('paragraph extraction client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({ ...fixtures, px_extractors: [extractor] });
  });

  beforeEach(() => {
    tenants.current().featureFlags = { paragraphExtraction: true };
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each(calls)('$name should match $path for an admin', async ({ path, query, call }) => {
    const { http, client } = await harness.as(callers.admin).outcomes(path, call, { query });

    expect(client).toEqual(http);
  });

  it('getExtractors should return the extractor', async () => {
    const body = await harness
      .as(callers.admin)
      .client(async c => c.paragraphExtraction.getExtractors());

    expect(body).toMatchObject([{ _id: extractorId.toString() }]);
  });

  it.each(calls)(
    '%s should be forbidden to anonymous users like %s',
    async ({ path, query, call }) => {
      const { http, client } = await harness.as(callers.anonymous).outcomes(path, call, { query });

      expect(http.status).toBe(401);
      expect(client).toEqual(http);
    }
  );

  it.each(calls)(
    '%s should be unavailable with the flag off like %s',
    async ({ path, query, call }) => {
      tenants.current().featureFlags = { paragraphExtraction: false };

      const { http, client } = await harness.as(callers.admin).outcomes(path, call, { query });

      expect(http.status).toBe(403);
      expect(client).toEqual(http);
    }
  );
});
