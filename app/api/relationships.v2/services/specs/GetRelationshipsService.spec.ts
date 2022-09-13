import { getConnection } from 'api/relationships.v2/database/getConnectionForCurrentTenant';
import { generateId } from 'api/relationships.v2/database/MongoIdGenerator';
import { PermissionsDataSource } from 'api/relationships.v2/database/PermissionsDataSource';
import { RelationshipsDataSource } from 'api/relationships.v2/database/RelationshipsDataSource';
import { User } from 'api/relationships.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { AuthorizationService } from '../AuthorizationService';
import { GetRelationshipsService } from '../GetRelationshipsService';

const factory = getFixturesFactory();

const mockUser = new User(generateId(), 'admin', []);

const fixtures = {
  relationships: [
    { _id: factory.id('rel1'), from: 'entity1', to: 'entity2', type: factory.id('relType1') },
    { _id: factory.id('rel2'), from: 'entity2', to: 'entity3', type: factory.id('relType1') },
    { _id: factory.id('rel3'), from: 'entity3', to: 'entity4', type: factory.id('relType1') },
    { _id: factory.id('rel4'), from: 'entity2', to: 'entity4', type: factory.id('relType1') },
    { _id: factory.id('rel5'), from: 'entity4', to: 'entity1', type: factory.id('relType1') },
    { _id: factory.id('rel6'), from: 'entity5', to: 'entity1', type: factory.id('relType1') },
  ],
  entities: [
    factory.entity('entity1'),
    factory.entity('entity2'),
    factory.entity('entity4'),
    factory.entity('entity5'),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when getting the relationships for an entity', () => {
  it('should return the incoming and outcomming relationships, paginated', async () => {
    const service = new GetRelationshipsService(
      new RelationshipsDataSource(getConnection()),
      new AuthorizationService(new PermissionsDataSource(getConnection()), mockUser)
    );

    const page1 = await (await service.getByEntity('entity1')).page(1, 2);
    const page2 = await (await service.getByEntity('entity1')).page(2, 2);

    expect(page1).toEqual({
      data: [
        expect.objectContaining({
          _id: factory.id('rel1').toHexString(),
          from: {
            sharedId: 'entity1',
            title: 'entity1',
          },
          to: {
            sharedId: 'entity2',
            title: 'entity2',
          },
        }),
        expect.objectContaining({
          _id: factory.id('rel5').toHexString(),
          from: {
            sharedId: 'entity4',
            title: 'entity4',
          },
          to: {
            sharedId: 'entity1',
            title: 'entity1',
          },
        }),
      ],
      total: 3,
    });

    expect(page2).toEqual({
      data: [
        expect.objectContaining({
          _id: factory.id('rel6').toHexString(),
          from: {
            sharedId: 'entity5',
            title: 'entity5',
          },
          to: {
            sharedId: 'entity1',
            title: 'entity1',
          },
        }),
      ],
      total: 3,
    });
  });
});
