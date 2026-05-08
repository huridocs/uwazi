import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ProvisionEntityAccessPolicyUseCaseFactory } from '#api/core/infrastructure/factories/ProvisionEntityAccessPolicyUseCaseFactory.js';
import { EntityAccessPolicyDataSourceFactory } from '#api/core/infrastructure/factories/EntityAccessPolicyDataSourceFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { EntityIndexerServiceFactory } from '#api/core/infrastructure/factories/EntityIndexerServiceFactory.js';

const admin = new User('admin-id', 'admin', []);

const fixtures = {
  entities: [
    { _id: new ObjectId(), sharedId: 'entity-1', language: 'en', permissions: [] },
    { _id: new ObjectId(), sharedId: 'entity-1', language: 'es', permissions: [] },
    { _id: new ObjectId(), sharedId: 'entity-2', language: 'en', permissions: [] },
    { _id: new ObjectId(), sharedId: 'entity-3', language: 'en', permissions: [] },
    { _id: new ObjectId(), sharedId: 'entity-4', language: 'en', permissions: [] },
  ],
};

const createSut = () =>
  testingEnvironment.runWithContext(
    () => ({
      sut: ProvisionEntityAccessPolicyUseCaseFactory.default({
        entityAccessPolicyDS: EntityAccessPolicyDataSourceFactory.default({
          entityIndexerService: EntityIndexerServiceFactory.forTests(),
        }),
      }),
    }),
    { actor: admin }
  );

describe('ProvisionEntityAccessPolicy', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('creates a policy with a write grant for the creator on all language variants', async () => {
    const { sut } = createSut();

    await sut.execute({ sharedId: 'entity-1', creatorId: 'user-1' });

    const docs = await getConnection()
      .collection('entities')
      .find({ sharedId: 'entity-1' })
      .toArray();

    expect(docs).toHaveLength(2);
    docs.forEach(doc => {
      expect(doc.published).toBe(false);
      expect(doc.permissions).toEqual([
        { refId: 'user-1', type: GrantType.User, level: AccessLevel.Write },
      ]);
    });
  });

  it('creates a policy with no grants when creatorId is empty', async () => {
    const { sut } = createSut();

    await sut.execute({ sharedId: 'entity-2', creatorId: '' });

    const doc = await getConnection().collection('entities').findOne({ sharedId: 'entity-2' });

    expect(doc).not.toBeNull();
    expect(doc!.permissions).toEqual([]);
  });
});
