import { AbstractEvent } from 'api/eventsbus';
import { Relationship } from '../model/Relationship';

interface RelationshipCreationData {
  relationships: Relationship[];
  markedEntities: string[];
}

class RelationshipsCreatedEvent extends AbstractEvent<RelationshipCreationData> {}

export { RelationshipsCreatedEvent };
