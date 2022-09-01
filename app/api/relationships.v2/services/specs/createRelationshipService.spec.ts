import {
  getConnection,
  getClient,
} from 'api/relationships.v2/database/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { CreateRelationshipService } from '../CreateRelationshipService';
import { EntitiesDataSource } from '../../database/EntitiesDataSource';
import { RelationshipsDataSource } from '../../database/RelationshipsDataSource';

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

const dummyTM = {
  run(cb: any) {
    return cb();
  },
};

describe('When the entities exist', () => {
  it('should return a new connection', async () => {
    const connection = getConnection();
    const service = new CreateRelationshipService(
      new RelationshipsDataSource(connection),
      new EntitiesDataSource(connection),
      dummyTM
    );
    const relationship = await service.create('entity1', 'entity2');

    expect(relationship).toEqual({
      _id: expect.anything(),
      from: 'entity1',
      to: 'entity2',
    });
  });

  it('should persist a new connection', async () => {
    const connection = getConnection();
    const service = new CreateRelationshipService(
      new RelationshipsDataSource(connection),
      new EntitiesDataSource(connection),
      dummyTM
    );
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
    const connection = getConnection();
    const service = new CreateRelationshipService(
      new RelationshipsDataSource(connection),
      new EntitiesDataSource(connection),
      dummyTM
    );
    try {
      await service.create('entity1', 'non-existing');
      fail('should throw error');
    } catch (e) {
      await expect(e.message).toMatch(/entities/);
    }
  });
});
