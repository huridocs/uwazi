import { RelationshipPropertyUpdateStrategy as Strategy } from './RelationshipPropertyUpdateStrategy';

export class QueuedRelationshipPropertyUpdateStrategy implements Strategy {
  async update(candidateIds: string[]): Promise<void> {
    console.log(
      `[${QueuedRelationshipPropertyUpdateStrategy.name}] Fake enqueuing: ${candidateIds.join(
        ', '
      )}`
    );
  }
}
