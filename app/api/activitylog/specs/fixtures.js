export default {
  activitylogs: [
    {
      method: 'POST',
      url: '/api/entities',
      query: '{}',
      body: '{"_id":"123","title":"Hello"}',
      time: 5000,
      username: 'admin',
    },
    { method: 'PUT', url: '/api/entities', query: '{"name": "Hello"}', body: '{}', time: 8000 },
    { method: 'PUT', url: '/api/entities/Hello', query: '{}', body: '{}', time: 6000 },
    {
      method: 'PUT',
      url: '/api/templates',
      query: '{}',
      body: '{}',
      time: 1000,
      username: 'Hello',
    },
    {
      method: 'DELETE',
      url: '/api/entities',
      query: '{"sharedId":"123"}',
      body: '{}',
      time: 2000,
      username: 'admin',
    },
    {
      method: 'POST',
      url: '/api/semantic-search/notify-updates',
      query: '{}',
      body: '{}',
      time: 3000,
      username: 'admin',
    },
  ],
};
