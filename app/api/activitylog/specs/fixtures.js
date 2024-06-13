export default {
  activitylogs: [
    {
      method: 'POST',
      url: '/api/entities',
      query: '{}',
      body: '{"title":"Hello"}',
      time: 1200002400000,
      username: 'admin',
    },
    {
      method: 'PUT',
      url: '/api/entities',
      query: '{"name": "Hello"}',
      body: '{}',
      time: 1400000400000,
    },
    { method: 'PUT', url: '/api/entities/Hello', query: '{}', body: '{}', time: 1300003200000 },
    {
      method: 'PUT',
      url: '/api/templates',
      query: '{}',
      body: '{}',
      time: 1000011600000,
      username: 'Hello',
    },
    {
      method: 'DELETE',
      url: '/api/entities',
      query: '{"sharedId":"123"}',
      body: '{}',
      time: 1100001600000,
      username: 'admin',
    },
    {
      method: 'POST',
      url: '/api/entities',
      query: '{"sharedId":"123"}',
      body: '{"_id":"456","title":"Entity 1"}',
      time: 1500008400000,
    },
  ],
};
