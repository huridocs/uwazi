/* eslint-disable max-len */

export default {
  activitylogs: [
    { method: 'POST', url: '/api/entities', query: '{}', body: '{"_id":"123","title":"Hello"}', time: 1560770143000, username: 'admin' },
    { method: 'PUT', url: '/api/entities', query: '{}', body: '{}', time: 1560770143000 },
    { method: 'PUT', url: '/api/entities', query: '{}', body: '{}', time: 1560942943000 },
    { method: 'PUT', url: '/api/templates', query: '{}', body: '{}', time: 1560770143000 },
    { method: 'DELETE', url: '/api/entities', query: '{"sharedId":"123"}', body: '{}', time: 1560770143000, username: 'admin' },
  ]
};
