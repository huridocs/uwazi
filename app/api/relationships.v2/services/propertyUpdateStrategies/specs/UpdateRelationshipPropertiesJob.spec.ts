// @ts-expect-error TS(2307): Cannot find module '../common.v2/testing/partialIm... Remove this comment to see the full error message
import { partialImplementation } from '../common.v2/testing/partialImplementation.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/services/Entity... Remove this comment to see the full error message
import { EntityRelationshipsUpdateService } from '../entities.v2/services/EntityRelationshipsUpdateService.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/Transac... Remove this comment to see the full error message
import { TransactionManager } from '../common.v2/contracts/TransactionManager.js';
import { UpdateRelationshipPropertiesJob } from '../UpdateRelationshipPropertiesJob';

it('should execute the updater and reindex the entity', async () => {
  const indexEntity = jest.fn();
  const updater = partialImplementation<EntityRelationshipsUpdateService>({
    update: jest.fn(),
  });
  const onCommitedCallbacks: Function[] = [];
  const transactionManager = partialImplementation<TransactionManager>({
    // @ts-expect-error TS(7006): Parameter 'callback' implicitly has an 'any' type.
    async run(callback) {
      const result = await callback();
      await Promise.all(onCommitedCallbacks.map(cb => cb()));
      return result;
    },
    // @ts-expect-error TS(7006): Parameter 'callback' implicitly has an 'any' type.
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
