import { EventsBus } from 'api/eventsbus';
import { search } from 'api/search';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { RelationshipsCreatedEvent } from 'api/relationships.v2/events/RelationshipsCreatedEvent';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(RelationshipsCreatedEvent, async ({ markedEntities }) => {
    if (
      (await new MongoSettingsDataSource(getConnection()).readNewRelationshipsAllowed()) &&
      markedEntities.length
    ) {
      await search.indexEntities({ sharedId: { $in: markedEntities } });
    }
  });
};

export { registerEventListeners };
