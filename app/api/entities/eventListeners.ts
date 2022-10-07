import { EventsBus } from 'api/eventsbus';
import { search } from 'api/search';
import { RelationshipsCreatedEvent } from 'api/relationships.v2/events/RelationshipsCreatedEvent';

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(RelationshipsCreatedEvent, async ({ markedEntities }) => {
    if (markedEntities.length) {
      await search.indexEntities({ sharedId: { $in: markedEntities } });
    }
  });
};

export { registerEventListeners };
