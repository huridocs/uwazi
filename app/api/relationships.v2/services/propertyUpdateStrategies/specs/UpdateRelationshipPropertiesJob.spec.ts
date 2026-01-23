import { partialImplementation } from '#api/common.v2/testing/partialImplementation.js';

import { EntityRelationshipsUpdateService } from '#api/entities.v2/services/EntityRelationshipsUpdateService.js';

import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UpdateRelationshipPropertiesJob } from '#api/relationships.v2/services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob.js';

it('should execute the updater and reindex the entity', async () => {
  const indexEntity = jest.fn();
  const updater = partialImplementation<EntityRelationshipsUpdateService>({
    update: jest.fn(),
  });
  const onCommitedCallbacks: Function[] = [];
  const transactionManager = partialImplementation<TransactionManager>({
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
  const job = new UpdateRelationshipPropertiesJob(updater, transactionManager, indexEntity);

  await job.handleDispatch(async () => {}, { entityIds: ['entity'] });
  expect(updater.update).toHaveBeenCalledWith(['entity']);
  expect(indexEntity).toHaveBeenCalledWith(['entity']);
});
