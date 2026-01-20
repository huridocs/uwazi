import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CollectionWrapper } from '#api/core/infrastructure/mongodb/common/CollectionWrapper.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

class TestingWrapper extends CollectionWrapper {}

describe('CollectionWrapper', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      test_collection: [],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should implement getter for collectionName', async () => {
    const wrapper = new TestingWrapper(getConnection().collection('test_collection'));

    expect(wrapper.collectionName).toBe('test_collection');
  });
});
