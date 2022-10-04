import { AbstractEvent } from 'api/eventsbus';
import { Relationship } from '../model/Relationship';

interface RelationshipCreationData {
  relationships: Relationship[];
  markedEntities: any[];
}

class RelationshipsCreatedEvent extends AbstractEvent<RelationshipCreationData> {}

export { RelationshipsCreatedEvent };
