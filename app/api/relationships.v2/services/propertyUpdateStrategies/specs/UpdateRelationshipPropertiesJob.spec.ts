import { UpdateRelationshipPropertiesJob } from '../UpdateRelationshipPropertiesJob';

it('should throw an error if a dependency is missing', async () => {
  const job = new UpdateRelationshipPropertiesJob('entity');

  try {
    await job.handle();
    throw new Error('should have failed');
  } catch (e) {
    await expect(e.message).toMatch('updater');
  }
});
