import { QueueProvider } from 'api/queue/contracts/QueueProvider';
import { RelationshipPropertyUpdateStrategy as Strategy } from './RelationshipPropertyUpdateStrategy';
import { UpdateRelationshipPropertiesJob } from './UpdateRelationshipPropertiesJob';

export class QueuedRelationshipPropertyUpdateStrategy implements Strategy {
  private queue: QueueProvider;

  constructor(queue: QueueProvider) {
    this.queue = queue;
  }

  async update(candidateIds: string[]): Promise<void> {
    await this.queue.push(new UpdateRelationshipPropertiesJob(candidateIds));
  }
}
