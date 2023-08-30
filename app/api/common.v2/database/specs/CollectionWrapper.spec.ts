import { testingEnvironment } from 'api/utils/testingEnvironment';
import { CollectionWrapper } from '../CollectionWrapper';
import { getConnection } from '../getConnectionForCurrentTenant';

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
