import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { UpdateRelationshipPropertiesJob } from '../UpdateRelationshipPropertiesJob';

it('should throw an error if a dependency is missing', async () => {
  const job = new UpdateRelationshipPropertiesJob(['entity']);

  try {
    await job.handle();
    throw new Error('should have failed');
  } catch (e) {
    await expect(e.message).toMatch('updater');
  }
});

it('should execute the updater and reindex the entity', async () => {
  const job = new UpdateRelationshipPropertiesJob(['entity']);
  job.indexEntity = jest.fn();
  job.updater = partialImplementation<EntityRelationshipsUpdateService>({
    update: jest.fn(),
  });
  const onCommitedCallbacks: Function[] = [];
  job.transactionManager = partialImplementation<TransactionManager>({
    async run(callback) {
      const result = await callback();
      await Promise.all(onCommitedCallbacks.map(cb => cb()));
      return result;
    },
    onCommitted(callback) {
      onCommitedCallbacks.push(callback);
      return this as TransactionManager;
    },
  });

  await job.handle();
  expect(job.updater.update).toHaveBeenCalledWith(['entity']);
  expect(job.indexEntity).toHaveBeenCalledWith(['entity']);
});
