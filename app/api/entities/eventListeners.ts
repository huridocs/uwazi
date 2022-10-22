import { EventsBus } from 'api/eventsbus';
import { search } from 'api/search';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { RelationshipsCreatedEvent } from 'api/relationships.v2/events/RelationshipsCreatedEvent';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(RelationshipsCreatedEvent, async ({ markedEntities }) => {
    if (
      (await new MongoSettingsDataSource(
        getConnection(),
        new MongoTransactionManager(getClient())
      ).readNewRelationshipsAllowed()) &&
      markedEntities.length
    ) {
      await search.indexEntities({ sharedId: { $in: markedEntities } });
    }
  });
};

export { registerEventListeners };
