/**
 * The entries behind the `list` contract suite, as the middleware stores them. Declared once, in
 * the shape Mongo holds.
 */
const T = {
  templatesPut: 1000011600000,
  entitiesDelete: 1100001600000,
  entitiesCreate: 1200002400000,
  entitiesHelloPut: 1300003200000,
  entitiesPut: 1400000400000,
  entitiesPost: 1500008400000,
};

const listFixtures = {
  activitylogs: [
    {
      method: 'POST',
      url: '/api/entities',
      query: '{}',
      body: '{"title":"Hello"}',
      time: T.entitiesCreate,
      username: 'admin',
    },
    {
      method: 'PUT',
      url: '/api/entities',
      query: '{"name": "Hello"}',
      body: '{}',
      time: T.entitiesPut,
    },
    {
      method: 'PUT',
      url: '/api/entities/Hello',
      query: '{}',
      body: '{}',
      time: T.entitiesHelloPut,
    },
    {
      method: 'PUT',
      url: '/api/templates',
      query: '{}',
      body: '{}',
      time: T.templatesPut,
      username: 'Hello',
    },
    {
      method: 'DELETE',
      url: '/api/entities',
      query: '{"sharedId":"123"}',
      body: '{}',
      time: T.entitiesDelete,
      username: 'admin',
    },
    {
      method: 'POST',
      url: '/api/entities',
      query: '{"sharedId":"123"}',
      body: '{"_id":"456","title":"Entity 1"}',
      time: T.entitiesPost,
    },
  ],
};

/** Every entry, newest first. */
const NEWEST_FIRST = [
  T.entitiesPost,
  T.entitiesPut,
  T.entitiesHelloPut,
  T.entitiesCreate,
  T.entitiesDelete,
  T.templatesPut,
];

export { listFixtures, NEWEST_FIRST, T };
