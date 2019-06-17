/* eslint-disable max-len */

export default {
  activitylogs: [
    { method: 'POST', url: '/api/entities', query: '{}', body: '{"_id":"123","title":"Hello"}', time: new Date(1560770143000), username: 'admin' },
    { method: 'GET', url: '/api/entities', query: '{}', body: '{}', time: new Date(1560770143000) },
    { method: 'GET', url: '/api/entities', query: '{}', body: '{}', time: new Date(1560942943000) },
    { method: 'GET', url: '/api/templates', query: '{}', body: '{}', time: new Date(1560770143000) },
    { method: 'DELETE', url: '/api/entities', query: '{"sharedId":"123"}', body: '{}', time: new Date(1560770143000), username: 'admin' },
  ]
};
