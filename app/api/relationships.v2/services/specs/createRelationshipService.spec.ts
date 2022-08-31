import {
  getConnection,
  getClient,
} from 'api/relationships.v2/database/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { CreateRelationshipService } from '../createRelationshipService';

const factory = getFixturesFactory();

const collectionInDb = () => testingDB.mongodb?.collection('relationships')!;

const fixtures = {
  entities: [factory.entity('entity1', 'template1'), factory.entity('entity2', 'template1')],
  templates: [factory.template('template1')],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('When the entities exist', () => {
  it('should return a new connection', async () => {
    const service = new CreateRelationshipService(getConnection(), getClient());
    const relationship = await service.create('entity1', 'entity2');

    expect(relationship).toEqual({
      _id: expect.anything(),
      from: 'entity1',
      to: 'entity2',
    });
  });

  it('should persist a new connection', async () => {
    const service = new CreateRelationshipService(getConnection(), getClient());
    await service.create('entity1', 'entity2');

    const relatinshipsInDb = await collectionInDb().find({}).toArray();

    expect(relatinshipsInDb).toEqual([
      {
        _id: expect.anything(),
        from: 'entity1',
        to: 'entity2',
      },
    ]);
  });
});

describe('When an entity does not exist', () => {
  it('should throw a validation error', async () => {
    const service = new CreateRelationshipService(getConnection(), getClient());
    try {
      await service.create('entity1', 'non-existing');
      fail('should throw error');
    } catch (e) {
      await expect(e.message).toMatch(/entities/);
    }
  });
});
