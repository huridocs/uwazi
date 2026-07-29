import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { createServerRelationshipTypesService } from '../ServerRelationshipTypesService.js';

const factory = getFixturesFactory();
const ctx = { headers: { cookie: 'session=1' } };
const service = createServerRelationshipTypesService(ctx);

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [
    { _id: factory.id('rel1'), name: 'Related to', properties: [] },
    { _id: factory.id('rel2'), name: 'Part of', properties: [] },
  ],
};

describe('ServerRelationshipTypesService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  }, 30000);

  afterAll(async () => {
    await testingEnvironment.tearDown();
  }, 30000);

  it('getAll returns rows with string _id', async () => {
    const [data, error] = await testingEnvironment.runWithContext(async () => service.getAll());

    expect(error).toBeUndefined();
    expect(data).toEqual(
      expect.arrayContaining([
        { _id: factory.id('rel1').toHexString(), name: 'Related to' },
        { _id: factory.id('rel2').toHexString(), name: 'Part of' },
      ])
    );
  });

  it('upsert returns not implemented', async () => {
    const [data, error] = await service.upsert({ name: 'Related to' });

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });

  it('delete returns not implemented', async () => {
    const [data, error] = await service.delete(['rt1']);

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });
});
