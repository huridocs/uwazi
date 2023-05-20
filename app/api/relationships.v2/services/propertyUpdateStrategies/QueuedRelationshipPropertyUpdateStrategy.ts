import { JobsDispatcher } from 'api/queue/contracts/JobsDispatcher';
import { RelationshipPropertyUpdateStrategy as Strategy } from './RelationshipPropertyUpdateStrategy';
import { UpdateRelationshipPropertiesJob } from './UpdateRelationshipPropertiesJob';

export class QueuedRelationshipPropertyUpdateStrategy implements Strategy {
  private queue: JobsDispatcher;

  constructor(queue: JobsDispatcher) {
    this.queue = queue;
  }

  async update(candidateIds: string[]): Promise<void> {
    await Promise.all(
      candidateIds.map(async candidate =>
        this.queue.dispatch(new UpdateRelationshipPropertiesJob(candidate))
      )
    );
  }
}
